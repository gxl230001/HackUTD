import time
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app import auth as auth_module
from app.auth import AuthError, verify_access_token
from tests.conftest import SUPABASE_URL, USER_A, auth, make_token


def test_missing_token_is_401(client):
    response = client.get("/api/family")
    assert response.status_code == 401


def test_garbage_token_is_401(client):
    response = client.get("/api/family", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401


def test_expired_token_is_401(client):
    response = client.get("/api/family", headers=auth(expires_in=-10))
    assert response.status_code == 401
    assert "expired" in response.json()["detail"]


def test_wrong_secret_is_401(client):
    response = client.get("/api/family", headers=auth(secret="another-secret-that-is-long-enough-xxxx"))
    assert response.status_code == 401


def test_wrong_issuer_is_401(client):
    response = client.get("/api/family", headers=auth(issuer="https://evil.example/auth/v1"))
    assert response.status_code == 401


def test_wrong_audience_is_401(client):
    response = client.get("/api/family", headers=auth(audience="anon"))
    assert response.status_code == 401


def test_hs256_requires_configured_secret(settings):
    settings.supabase_jwt_secret = ""
    with pytest.raises(AuthError):
        verify_access_token(make_token(USER_A), settings)


def test_asymmetric_token_verified_via_jwks(settings, monkeypatch):
    private_key = ec.generate_private_key(ec.SECP256R1())

    class FakeJwks:
        def get_signing_key_from_jwt(self, _token):
            return type("Key", (), {"key": private_key.public_key()})()

    monkeypatch.setattr(auth_module, "_jwks_client", lambda _url: FakeJwks())
    now = int(time.time())
    user_id = uuid4()
    token = jwt.encode(
        {"sub": str(user_id), "aud": "authenticated", "iss": f"{SUPABASE_URL}/auth/v1", "exp": now + 60},
        private_key,
        algorithm="ES256",
        headers={"kid": "test"},
    )
    assert verify_access_token(token, settings).id == user_id
