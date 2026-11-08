from datetime import UTC, datetime, timedelta
from itertools import count
from uuid import UUID, uuid4

from app.domain import ScamEvent

NOW = datetime(2026, 11, 8, 18, 0, tzinfo=UTC)
_n = count()


def ev(member_id: UUID, event_type: str, interaction: str | None, *, days_ago: float = 1, direction: str | None = None,
       category: str = "bank_impersonation", event_id: UUID | None = None) -> ScamEvent:
    metadata = {"direction": direction} if direction else {}
    return ScamEvent(
        id=event_id or uuid4(), member_id=member_id, event_type=event_type,
        timestamp=NOW - timedelta(days=days_ago, minutes=next(_n) % 50), source="synthetic_demo",
        interaction_type=interaction, scam_category=category, metadata=metadata,
    )


def blocked(m, **kw):
    return ev(m, "blocked_call", "blocked", **kw)


def reached(m, interaction="not_answered", **kw):
    return ev(m, "scam_likely_call", interaction, direction="inbound", **kw)


def returned(m, **kw):
    return ev(m, "scam_likely_call", "returned", direction="outbound", **kw)


def reported(m, **kw):
    return ev(m, "reported_number", "reported", **kw)


def message(m, interaction="unknown", **kw):
    return ev(m, "suspicious_message", interaction, direction="inbound", **kw)
