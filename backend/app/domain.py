"""Normalized scam event used by all analytics. Independent of storage and source."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID


@dataclass(frozen=True)
class ScamEvent:
    id: UUID
    member_id: UUID
    event_type: str
    timestamp: datetime  # timezone-aware, UTC
    source: str
    interaction_type: str | None = None
    scam_category: str | None = None
    protection_status: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def direction(self) -> str:
        if self.interaction_type == "returned":
            return "outbound"
        return str(self.metadata.get("direction") or "inbound")

    # --- classification (one place, so every metric agrees) -----------------
    @property
    def is_blocked_call(self) -> bool:
        return self.event_type == "blocked_call"

    @property
    def is_reached_call(self) -> bool:
        """A labeled suspicious call that rang the member's phone."""
        return self.event_type == "scam_likely_call" and self.direction == "inbound"

    @property
    def is_inbound_call(self) -> bool:
        """Scam exposure: blocked + reached. Outbound call-backs are never exposure."""
        return self.is_blocked_call or self.is_reached_call

    @property
    def is_answered(self) -> bool:
        return self.is_reached_call and self.interaction_type == "answered"

    @property
    def is_returned(self) -> bool:
        return self.event_type == "scam_likely_call" and self.interaction_type == "returned"

    @property
    def is_report(self) -> bool:
        return self.event_type == "reported_number"

    @property
    def is_message(self) -> bool:
        return self.event_type == "suspicious_message"

    @property
    def is_reply(self) -> bool:
        return self.is_message and self.interaction_type == "replied"

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "ScamEvent":
        ts = row["timestamp"]
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return cls(
            id=UUID(str(row["id"])),
            member_id=UUID(str(row["family_member_id"])),
            event_type=row["event_type"],
            timestamp=ts,
            source=row["source"],
            interaction_type=row.get("interaction_type"),
            scam_category=row.get("scam_category"),
            protection_status=row.get("protection_status"),
            metadata=row.get("metadata") or {},
        )
