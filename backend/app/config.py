"""Environment-based configuration. All secrets come from env vars or backend/.env."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from typing import Annotated


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase. The service-role (secret) key bypasses RLS: backend use only.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    # Only needed for projects still using the legacy shared HS256 JWT secret.
    # Projects using asymmetric signing keys are verified via the JWKS endpoint.
    supabase_jwt_secret: str = ""
    supabase_jwt_audience: str = "authenticated"

    # Gemini (optional). Without a key, deterministic fallback explanations are used.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = 8.0
    # 0 disables "thinking" on 2.5 Flash models: faster, cheaper, enough for short text.
    # Set to -1 to leave the model default (needed for models that require thinking).
    gemini_thinking_budget: int = 0

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["http://localhost:5173"])
    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("supabase_url")
    @classmethod
    def _strip_url(cls, value: str) -> str:
        return value.strip().rstrip("/")

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def jwt_issuer(self) -> str:
        return f"{self.supabase_url}/auth/v1"

    @property
    def jwks_url(self) -> str:
        return f"{self.supabase_url}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
