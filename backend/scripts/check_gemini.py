"""Smoke-test the Gemini setup in backend/.env with one real request.

Usage (from backend/):  .venv/bin/python -m scripts.check_gemini

Sends one sample recommendation (no real user data) through the same call,
schema and safety checks the app uses, then reports whether the app would show
the AI explanation or fall back. Uses 1 request of your free-tier quota.
"""

import sys

from app.config import get_settings
from app.schemas.recommendations import Evidence, Recommendation
from app.services import explanations

SAMPLE = Recommendation(
    category="encourage_reporting",
    title="Try reporting suspicious numbers",
    reasons=["Several suspicious calls this period and none were reported."],
    evidence=[Evidence(key="suspicious_calls", label="Suspicious calls", value="8"),
              Evidence(key="reports", label="Numbers reported", value="0")],
    summary="", why_it_matters="", next_steps=[], features=[], mentions_premium=False,
)

HINTS = {
    400: "The key is malformed or the request was rejected. Re-copy the key from AI Studio.",
    401: "The key is invalid. Create a new one at https://aistudio.google.com/apikey.",
    403: "The key isn't allowed to call the Gemini API (wrong project, or the API is restricted).",
    404: "Model not found. Set GEMINI_MODEL to a current model, e.g. gemini-2.5-flash-lite.",
    429: "Free-tier quota hit. Wait a minute (per-minute limit) or until midnight Pacific "
         "(daily limit), or try GEMINI_MODEL=gemini-2.5-flash-lite.",
}


def main() -> int:
    settings = get_settings()
    if not settings.gemini_api_key:
        print("GEMINI_API_KEY is not set in backend/.env. The app will use fallback explanations.")
        return 1
    print(f"Model: {settings.gemini_model}  (key ...{settings.gemini_api_key[-4:]})")

    payload = explanations.build_payload(SAMPLE, "Grandpa", 30)
    try:
        text = explanations._call_gemini(settings, payload)
    except Exception as exc:  # noqa: BLE001 - report every failure mode readably
        code = getattr(exc, "code", None)
        print(f"FAILED ({type(exc).__name__}{f' {code}' if code else ''}): {str(exc)[:300]}")
        if code in HINTS:
            print(f"Hint: {HINTS[code]}")
        elif "timed out" in str(exc).lower() or "timeout" in type(exc).__name__.lower():
            print(f"Hint: no answer within {settings.gemini_timeout_seconds}s. Retry, or raise GEMINI_TIMEOUT_SECONDS.")
        return 1

    print(f"\nsummary:        {text.summary}\nwhy it matters: {text.why_it_matters}")
    for step in text.next_steps:
        print(f"next step:      {step}")
    if (reason := explanations.validate_output(text, payload)) is not None:
        print(f"\nGemini answered, but the safety check rejected it ({reason}). "
              "The app would show the standard explanation for this one.")
        return 1
    print("\nOK: Gemini is working. Recommendations will show the AI explanation.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
