"""AI-worded explanations for deterministic recommendations, via Gemini.

Safety model:
- Gemini receives ONLY the recommendation category, its supporting metrics, the
  period, and the member's display name. No events, phone labels or account data.
- Output must match a JSON schema, pass length limits, contain no number that
  wasn't in the input, avoid victim-blaming / loss claims, and only mention
  Scam Shield Premium when the deterministic rule allows it.
- Any failure (no key, timeout, rate limit, safety block, invalid output) falls
  back to the deterministic text. The category and metrics never change.
"""

import json
import logging
import re
import threading
import time
from collections import OrderedDict
from typing import Any

from pydantic import ValidationError

from app.config import Settings
from app.schemas.recommendations import ExplanationText, Recommendation

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 6 * 3600
CACHE_MAX_ENTRIES = 256

SYSTEM_INSTRUCTION = """You write short, calm, plain-language explanations for a family scam-awareness dashboard.

Rules you must follow:
- Use ONLY the facts in the provided JSON. Never invent activity, numbers, dates, account details, or subscription status.
- Do not do arithmetic. If you mention a number, copy it exactly from the JSON.
- Never say or imply that the person was scammed, lost money, shared information, or was deceived. Answering or returning a suspicious call does not prove harm.
- Never describe the person as careless, confused, naive, gullible, or similar. Be respectful and non-judgmental.
- Do not use fear-based or urgent language.
- Only mention Scam Shield Premium if "may_mention_premium" is true, and then only as an option to compare, noting it may already be included in their plan.
- Next steps must be practical actions done outside this app. Do not number them.
- Address the family plan account holder, and refer to the member by their display name.
Return JSON with: summary (1-2 sentences), why_it_matters (1-2 sentences), next_steps (1 or 2 short items)."""

BANNED_PATTERNS = [
    r"\bscammed\b", r"\bfell for\b", r"\bvictim", r"\blost (?:money|savings|funds)\b", r"\bfinancial loss",
    r"\bcompromised\b", r"\bcareless", r"\bgullible\b", r"\bnaive\b", r"\bconfused\b", r"\bsenile\b",
    r"\bstupid\b", r"\bhacked\b", r"\bstolen\b", r"\bguarantee", r"\balready (?:has|have|subscribed)",
]
NUMBER_PATTERN = re.compile(r"\d+(?:\.\d+)?")


class _TTLCache:
    def __init__(self, ttl: float, max_entries: int) -> None:
        self._data: OrderedDict[str, tuple[float, ExplanationText]] = OrderedDict()
        self._ttl, self._max = ttl, max_entries
        self._lock = threading.Lock()

    def get(self, key: str) -> ExplanationText | None:
        with self._lock:
            item = self._data.get(key)
            if item is None or time.monotonic() - item[0] > self._ttl:
                self._data.pop(key, None)
                return None
            self._data.move_to_end(key)
            return item[1]

    def set(self, key: str, value: ExplanationText) -> None:
        with self._lock:
            self._data[key] = (time.monotonic(), value)
            self._data.move_to_end(key)
            while len(self._data) > self._max:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


cache = _TTLCache(CACHE_TTL_SECONDS, CACHE_MAX_ENTRIES)


def build_payload(rec: Recommendation, member_name: str, period_days: int) -> dict[str, Any]:
    return {
        "member_display_name": member_name,
        "reporting_period_days": period_days,
        "recommendation_category": rec.category,
        "recommendation_title": rec.title,
        "reasons": rec.reasons,
        "supporting_metrics": [{"label": e.label, "value": e.value} for e in rec.evidence],
        "relevant_features": [{"name": f.name, "description": f.description} for f in rec.features],
        "may_mention_premium": rec.mentions_premium,
        "data_note": "All activity is simulated demo data.",
    }


def allowed_numbers(payload: dict[str, Any]) -> set[str]:
    return set(NUMBER_PATTERN.findall(json.dumps(payload, ensure_ascii=False)))


def validate_output(text: ExplanationText, payload: dict[str, Any]) -> str | None:
    """Returns a rejection reason, or None if the output is acceptable."""
    combined = " ".join([text.summary, text.why_it_matters, *text.next_steps])
    lowered = combined.lower()
    if any(len(step) > 240 or len(step) < 5 for step in text.next_steps):
        return "next step length out of range"
    for pattern in BANNED_PATTERNS:
        if re.search(pattern, lowered):
            return f"banned phrase: {pattern}"
    if not payload["may_mention_premium"] and "premium" in lowered:
        return "mentions Premium when not allowed"
    unexpected = set(NUMBER_PATTERN.findall(combined)) - allowed_numbers(payload)
    if unexpected:
        return f"numbers not in input: {sorted(unexpected)}"
    return None


def cache_key(member_id: str, period: str, rec: Recommendation, model: str) -> str:
    evidence = "|".join(f"{e.key}={e.value}" for e in rec.evidence)
    return f"{model}:{member_id}:{period}:{rec.category}:{evidence}"


def _call_gemini(settings: Settings, payload: dict[str, Any]) -> ExplanationText:
    from google import genai
    from google.genai import types

    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            timeout=int(settings.gemini_timeout_seconds * 1000),
            retry_options=types.HttpRetryOptions(attempts=1),  # no retries on the free tier
        ),
    )
    config: dict[str, Any] = {
        "system_instruction": SYSTEM_INSTRUCTION,
        "response_mime_type": "application/json",
        "response_schema": ExplanationText,
        "temperature": 0.2,
        "max_output_tokens": 600,
    }
    if settings.gemini_thinking_budget >= 0:
        config["thinking_config"] = types.ThinkingConfig(thinking_budget=settings.gemini_thinking_budget)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=json.dumps(payload, ensure_ascii=False),
        config=types.GenerateContentConfig(**config),
    )
    if isinstance(response.parsed, ExplanationText):
        return response.parsed
    if not response.text:
        raise ValueError("empty or blocked response")
    return ExplanationText.model_validate_json(response.text)


def generate(settings: Settings, rec: Recommendation, member_id: str, member_name: str,
             period: str, period_days: int) -> ExplanationText | None:
    """AI explanation, or None when the deterministic fallback should be used."""
    if not settings.gemini_api_key:
        return None
    key = cache_key(member_id, period, rec, settings.gemini_model)
    if (cached := cache.get(key)) is not None:
        return cached

    payload = build_payload(rec, member_name, period_days)
    try:
        text = _call_gemini(settings, payload)
    except ValidationError as exc:
        logger.warning("Gemini output failed schema validation: %s", exc.error_count())
        return None
    except Exception as exc:  # noqa: BLE001 - timeouts, 429s, network, safety blocks
        logger.warning("Gemini request failed (%s): %s", type(exc).__name__, str(exc)[:200])
        return None

    text = ExplanationText(
        summary=text.summary.strip(), why_it_matters=text.why_it_matters.strip(),
        next_steps=[s.strip().lstrip("-•* ").strip() for s in text.next_steps],
    )
    if (reason := validate_output(text, payload)) is not None:
        logger.warning("Rejected Gemini output for %s: %s", rec.category, reason)
        return None
    cache.set(key, text)
    return text
