"""Data access for scam events."""

from datetime import datetime
from typing import Protocol
from uuid import UUID

from supabase import Client

from app.domain import ScamEvent

PAGE_SIZE = 1000
EVENT_COLUMNS = (
    "id, family_member_id, event_type, timestamp, source, interaction_type, "
    "scam_category, protection_status, metadata"
)


class EventRepository(Protocol):
    def list_events(self, member_ids: list[UUID], start: datetime, end: datetime) -> list[ScamEvent]: ...


class SupabaseEventRepository:
    def __init__(self, client: Client) -> None:
        self._db = client

    def list_events(self, member_ids: list[UUID], start: datetime, end: datetime) -> list[ScamEvent]:
        """Events for the given members with start <= timestamp < end, newest first."""
        if not member_ids:
            return []
        events: list[ScamEvent] = []
        offset = 0
        while True:
            rows = (
                self._db.table("scam_events")
                .select(EVENT_COLUMNS)
                .in_("family_member_id", [str(m) for m in member_ids])
                .gte("timestamp", start.isoformat())
                .lt("timestamp", end.isoformat())
                .order("timestamp", desc=True)
                .order("id")
                .range(offset, offset + PAGE_SIZE - 1)
                .execute()
                .data
            )
            events.extend(ScamEvent.from_row(row) for row in rows)
            if len(rows) < PAGE_SIZE:
                return events
            offset += PAGE_SIZE
