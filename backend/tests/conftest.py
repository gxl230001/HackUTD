import time
from uuid import UUID, uuid4

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.deps import get_family_repository
from app.main import app

SUPABASE_URL = "https://test-project.supabase.co"
JWT_SECRET = "test-secret-at-least-32-bytes-long-xxxxxxxx"

FAMILY_A = UUID("00000000-0000-0000-0000-00000000000a")
FAMILY_B = UUID("00000000-0000-0000-0000-00000000000b")
USER_A = UUID("00000000-0000-0000-0000-0000000000a1")
USER_B = UUID("00000000-0000-0000-0000-0000000000b1")
USER_NO_FAMILY = UUID("00000000-0000-0000-0000-0000000000c1")
MEMBER_A1 = UUID("00000000-0000-0000-0000-0000000a0001")
MEMBER_B1 = UUID("00000000-0000-0000-0000-0000000b0001")


class FakeRepository:
    def __init__(self) -> None:
        self.profiles = {USER_A: FAMILY_A, USER_B: FAMILY_B}
        self.families = {FAMILY_A: "Rivera Family", FAMILY_B: "Other Family"}
        self.members = {
            FAMILY_A: [{"id": str(MEMBER_A1), "display_name": "Mom", "relationship": "Parent", "phone_label": "Ending in 0142"}],
            FAMILY_B: [{"id": str(MEMBER_B1), "display_name": "Someone", "relationship": None, "phone_label": None}],
        }

    def ping(self) -> None:
        return None

    def get_profile_family_id(self, user_id):
        return self.profiles.get(user_id)

    def get_family(self, family_id):
        name = self.families.get(family_id)
        return {"id": str(family_id), "name": name} if name else None

    def list_members(self, family_id):
        return list(self.members.get(family_id, []))

    def get_member(self, family_id, member_id):
        return next((m for m in self.members.get(family_id, []) if m["id"] == str(member_id)), None)


def make_token(user_id: UUID, *, secret: str = JWT_SECRET, expires_in: int = 3600, audience: str = "authenticated", issuer: str | None = None) -> str:
    now = int(time.time())
    claims = {
        "sub": str(user_id),
        "email": "demo@owlert.test",
        "aud": audience,
        "iss": issuer or f"{SUPABASE_URL}/auth/v1",
        "iat": now,
        "exp": now + expires_in,
        "role": "authenticated",
    }
    return jwt.encode(claims, secret, algorithm="HS256")


@pytest.fixture
def settings() -> Settings:
    return Settings(_env_file=None, supabase_url=SUPABASE_URL, supabase_service_role_key="x", supabase_jwt_secret=JWT_SECRET)


@pytest.fixture
def client(settings):
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_family_repository] = FakeRepository
    yield TestClient(app)
    app.dependency_overrides.clear()


def auth(user_id: UUID = USER_A, **kwargs) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(user_id, **kwargs)}"}


__all__ = ["auth", "uuid4"]
