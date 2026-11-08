"""Supabase access-token verification.

Supabase projects sign user JWTs either with asymmetric signing keys
(ES256/RS256, published at the project's JWKS endpoint) or, on older projects,
with a shared HS256 secret. Both are supported; JWKS is preferred.
"""

import logging
from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID

import jwt
from jwt import PyJWKClient

from app.config import Settings

logger = logging.getLogger(__name__)

ASYMMETRIC_ALGORITHMS = ["ES256", "RS256", "EdDSA"]


class AuthError(Exception):
    """Token missing, malformed, expired or not issued by this project."""


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str | None


@lru_cache
def _jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=3600, timeout=5)


def verify_access_token(token: str, settings: Settings) -> CurrentUser:
    if not settings.supabase_url:
        raise AuthError("Authentication is not configured on the server.")

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise AuthError("Malformed access token.") from exc

    algorithm = header.get("alg")
    try:
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret:
                raise AuthError("This project uses HS256 tokens; set SUPABASE_JWT_SECRET.")
            key: object = settings.supabase_jwt_secret
            algorithms = ["HS256"]
        elif algorithm in ASYMMETRIC_ALGORITHMS:
            key = _jwks_client(settings.jwks_url).get_signing_key_from_jwt(token).key
            algorithms = [algorithm]
        else:
            raise AuthError("Unsupported token algorithm.")

        claims = jwt.decode(
            token,
            key,  # type: ignore[arg-type]
            algorithms=algorithms,
            audience=settings.supabase_jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Access token has expired.") from exc
    except jwt.PyJWKClientError as exc:
        logger.warning("JWKS lookup failed: %s", exc)
        raise AuthError("Could not verify access token.") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid access token.") from exc

    try:
        user_id = UUID(claims["sub"])
    except (KeyError, ValueError) as exc:
        raise AuthError("Invalid access token subject.") from exc
    return CurrentUser(id=user_id, email=claims.get("email"))
