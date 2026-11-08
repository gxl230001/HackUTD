"""Data access for families, members and profiles.

Every member lookup is scoped by family_id so callers cannot read across
families even if they pass another family's member id.
"""

from typing import Any, Protocol
from uuid import UUID

from supabase import Client

MEMBER_COLUMNS = "id, display_name, relationship, phone_label"


class FamilyRepository(Protocol):
    def ping(self) -> None: ...
    def get_profile_family_id(self, user_id: UUID) -> UUID | None: ...
    def get_family(self, family_id: UUID) -> dict[str, Any] | None: ...
    def list_members(self, family_id: UUID) -> list[dict[str, Any]]: ...
    def get_member(self, family_id: UUID, member_id: UUID) -> dict[str, Any] | None: ...


class SupabaseFamilyRepository:
    def __init__(self, client: Client) -> None:
        self._db = client

    def ping(self) -> None:
        self._db.table("families").select("id").limit(1).execute()

    def get_profile_family_id(self, user_id: UUID) -> UUID | None:
        rows = self._db.table("profiles").select("family_id").eq("id", str(user_id)).limit(1).execute().data
        if not rows or rows[0].get("family_id") is None:
            return None
        return UUID(rows[0]["family_id"])

    def get_family(self, family_id: UUID) -> dict[str, Any] | None:
        rows = self._db.table("families").select("id, name").eq("id", str(family_id)).limit(1).execute().data
        return rows[0] if rows else None

    def list_members(self, family_id: UUID) -> list[dict[str, Any]]:
        return (
            self._db.table("family_members")
            .select(MEMBER_COLUMNS)
            .eq("family_id", str(family_id))
            .order("created_at")
            .order("display_name")
            .execute()
            .data
        )

    def get_member(self, family_id: UUID, member_id: UUID) -> dict[str, Any] | None:
        rows = (
            self._db.table("family_members")
            .select(MEMBER_COLUMNS)
            .eq("family_id", str(family_id))
            .eq("id", str(member_id))
            .limit(1)
            .execute()
            .data
        )
        return rows[0] if rows else None
