"""Deterministic synthetic scam-event generator for the demo family.

Every record is fictional and marked source="synthetic_demo". The generator is
pure (no I/O): same seed + anchor -> same events. Exact counts are produced per
30-day block so each member's pattern is stable; only timing is randomized.

Event model (one row per real-world activity, never duplicated):
  blocked_call        call stopped at the network         interaction=blocked
  scam_likely_call    labeled call reached the phone       interaction=answered|not_answered
  scam_likely_call    member called the number back        interaction=returned, direction=outbound
  reported_number     member reported the number           interaction=reported
  suspicious_message  suspicious text                      interaction=replied|unknown
"""

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID, uuid5

SOURCE = "synthetic_demo"
NAMESPACE = UUID("6f1c2b7e-0d4a-4c3e-9a51-3c1e2f0a9b10")
DEFAULT_SEED = 20261108
BLOCK_DAYS = 30
BLOCKS = 3  # 90 days of history


@dataclass(frozen=True)
class Profile:
    """Exact counts per 30-day block."""

    blocked: int
    answered: int
    not_answered: int
    returned: int
    reported: int
    messages: int
    replied: int
    call_categories: tuple[str, ...]
    message_categories: tuple[str, ...]


PROFILES: dict[str, Profile] = {
    # High exposure, mostly blocked, few interactions.
    "mom": Profile(
        blocked=18, answered=2, not_answered=10, returned=0, reported=1, messages=3, replied=0,
        call_categories=("bank_impersonation", "car_warranty", "government_impersonation", "utility_shutoff", "delivery"),
        message_categories=("delivery", "bank_impersonation"),
    ),
    # Moderate exposure, fewer blocks, more answered and returned calls.
    "grandpa": Profile(
        blocked=2, answered=5, not_answered=1, returned=3, reported=0, messages=2, replied=1,
        call_categories=("medicare_benefits", "tech_support", "family_emergency", "prize_lottery"),
        message_categories=("prize_lottery", "delivery"),
    ),
    # Lower exposure, moderate blocking, consistent reporting.
    "daughter": Profile(
        blocked=5, answered=1, not_answered=4, returned=0, reported=4, messages=6, replied=0,
        call_categories=("delivery", "job_offer", "bank_impersonation", "crypto_investment"),
        message_categories=("toll_payment", "delivery", "job_offer"),
    ),
}

# Scam calls cluster in weekday business hours.
HOUR_WEIGHTS = {h: w for h, w in zip(range(8, 21), (2, 4, 6, 7, 6, 5, 6, 7, 6, 4, 3, 2, 1))}


class _Builder:
    def __init__(self, member_id: str, key: str, rng: random.Random, anchor: datetime) -> None:
        self.member_id, self.key, self.rng, self.anchor = member_id, key, rng, anchor
        self.rows: list[dict[str, Any]] = []

    def _random_time(self, block: int) -> datetime:
        block_start = self.anchor - timedelta(days=BLOCK_DAYS * (block + 1))
        while True:
            day = block_start + timedelta(days=self.rng.randrange(BLOCK_DAYS))
            if day.weekday() >= 5 and self.rng.random() < 0.5:
                continue  # fewer events on weekends
            hour = self.rng.choices(list(HOUR_WEIGHTS), weights=list(HOUR_WEIGHTS.values()))[0]
            ts = day.replace(hour=hour, minute=self.rng.randrange(60), second=self.rng.randrange(60), microsecond=0)
            if ts < self.anchor:
                return ts

    def _after(self, ts: datetime, min_minutes: int, max_minutes: int) -> datetime:
        later = ts + timedelta(minutes=self.rng.randint(min_minutes, max_minutes))
        return min(later, self.anchor - timedelta(minutes=1))

    def add(self, event_type: str, ts: datetime, interaction: str, category: str, *,
            protection: str | None, direction: str | None = None, related: str | None = None) -> str:
        n = len(self.rows)
        event_id = str(uuid5(NAMESPACE, f"event:{self.key}:{n}"))
        metadata: dict[str, Any] = {"external_ref": f"demo:{self.key}:{n}", "synthetic": True}
        if direction:
            metadata["direction"] = direction
        if related:
            metadata["related_event_id"] = related
        self.rows.append({
            "id": event_id,
            "family_member_id": self.member_id,
            "event_type": event_type,
            "timestamp": ts.isoformat(),
            "source": SOURCE,
            "interaction_type": interaction,
            "scam_category": category,
            "protection_status": protection,
            "metadata": metadata,
        })
        return event_id


def generate_member_events(member_id: str, key: str, anchor: datetime, seed: int = DEFAULT_SEED) -> list[dict[str, Any]]:
    profile = PROFILES[key]
    rng = random.Random(f"{seed}:{key}")
    b = _Builder(member_id, key, rng, anchor)

    for block in range(BLOCKS):
        for _ in range(profile.blocked):
            b.add("blocked_call", b._random_time(block), "blocked", rng.choice(profile.call_categories), protection="scam_block")

        reached: list[tuple[str, datetime, str]] = []
        outcomes = ["answered"] * profile.answered + ["not_answered"] * profile.not_answered
        for outcome in outcomes:
            ts, category = b._random_time(block), rng.choice(profile.call_categories)
            event_id = b.add("scam_likely_call", ts, outcome, category, protection="scam_id_labeled", direction="inbound")
            reached.append((event_id, ts, category))

        for event_id, ts, category in rng.sample(reached, min(profile.returned, len(reached))):
            b.add("scam_likely_call", b._after(ts, 5, 36 * 60), "returned", category,
                  protection=None, direction="outbound", related=event_id)
        for event_id, ts, category in rng.sample(reached, min(profile.reported, len(reached))):
            b.add("reported_number", b._after(ts, 1, 90), "reported", category, protection=None, related=event_id)

        replies = set(rng.sample(range(profile.messages), min(profile.replied, profile.messages)))
        for i in range(profile.messages):
            b.add("suspicious_message", b._random_time(block), "replied" if i in replies else "unknown",
                  rng.choice(profile.message_categories), protection="flagged", direction="inbound")

    return sorted(b.rows, key=lambda row: row["timestamp"])


def generate_family_events(members: dict[str, str], anchor: datetime, seed: int = DEFAULT_SEED) -> list[dict[str, Any]]:
    """members maps profile key ('mom', 'grandpa', 'daughter') -> family_member_id."""
    rows: list[dict[str, Any]] = []
    for key, member_id in members.items():
        rows.extend(generate_member_events(member_id, key, anchor, seed))
    return rows
