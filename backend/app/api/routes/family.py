from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.deps import FamilyId, Repo
from app.schemas.family import Family, Member
from app.services import family as family_service
from app.services.family import NotFoundError

router = APIRouter(tags=["family"])


@router.get("/family", response_model=Family)
def get_family(family_id: FamilyId, repo: Repo) -> Family:
    try:
        return family_service.get_family_overview(repo, family_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/members", response_model=list[Member])
def list_members(family_id: FamilyId, repo: Repo) -> list[Member]:
    return family_service.list_members(repo, family_id)


@router.get("/members/{member_id}", response_model=Member)
def get_member(member_id: UUID, family_id: FamilyId, repo: Repo) -> Member:
    # A member outside the caller's family returns 404, not 403, so the
    # response does not reveal whether that member exists.
    try:
        return family_service.get_member(repo, family_id, member_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
