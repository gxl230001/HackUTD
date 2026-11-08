"""FastAPI dependencies: database access, authentication, family scoping."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import AuthError, CurrentUser, verify_access_token
from app.config import Settings, get_settings
from app.db import get_supabase
from app.repositories.events import EventRepository, SupabaseEventRepository
from app.repositories.families import FamilyRepository, SupabaseFamilyRepository

_bearer = HTTPBearer(auto_error=False)


def get_family_repository() -> FamilyRepository:
    client = get_supabase()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database is not configured.")
    return SupabaseFamilyRepository(client)


def get_event_repository() -> EventRepository:
    client = get_supabase()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database is not configured.")
    return SupabaseEventRepository(client)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Not signed in.", headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        return verify_access_token(credentials.credentials, settings)
    except AuthError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, str(exc), headers={"WWW-Authenticate": "Bearer"}
        ) from exc


def get_family_id(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    repo: Annotated[FamilyRepository, Depends(get_family_repository)],
) -> UUID:
    """The family the signed-in user belongs to. Every data route is scoped by this."""
    family_id = repo.get_profile_family_id(user.id)
    if family_id is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No family is linked to this account.")
    return family_id


Repo = Annotated[FamilyRepository, Depends(get_family_repository)]
Events = Annotated[EventRepository, Depends(get_event_repository)]
FamilyId = Annotated[UUID, Depends(get_family_id)]
