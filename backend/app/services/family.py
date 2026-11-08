"""Family and member read operations (business rules live here, not in routes)."""

from uuid import UUID

from app.repositories.families import FamilyRepository
from app.schemas.family import Family, Member


class NotFoundError(Exception):
    """The requested record does not exist within the caller's family."""


def get_family_overview(repo: FamilyRepository, family_id: UUID) -> Family:
    family = repo.get_family(family_id)
    if family is None:
        raise NotFoundError("Family not found.")
    members = repo.list_members(family_id)
    return Family(id=family["id"], name=family["name"], member_count=len(members))


def list_members(repo: FamilyRepository, family_id: UUID) -> list[Member]:
    return [Member.model_validate(row) for row in repo.list_members(family_id)]


def get_member(repo: FamilyRepository, family_id: UUID, member_id: UUID) -> Member:
    row = repo.get_member(family_id, member_id)
    if row is None:
        raise NotFoundError("Member not found.")
    return Member.model_validate(row)
