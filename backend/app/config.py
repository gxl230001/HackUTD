"""Environment-based configuration. All secrets come from env vars or backend/.env."""

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
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
    # An API key from your Google Cloud / AI Studio project. GOOGLE_API_KEY is accepted too.
    gemini_api_key: str = Field(default="", validation_alias=AliasChoices("gemini_api_key", "google_api_key"))
    # Set true only for a Vertex AI API key (Cloud console → Vertex AI → API keys).
    # Keys from AI Studio or the "Gemini API" in a Cloud project use the default (false).
    gemini_use_vertexai: bool = False
    gemini_model: str = "gemini-3.5-flash"
    # Google rejects request deadlines under 10 s, so lower values are raised to 10.
    gemini_timeout_seconds: float = 10.0
    # Gemini 3 thinking level. "minimal" is fastest and enough for short text, and saves
    # free-tier quota. Leave empty for the model default (some models don't support "minimal").
    gemini_thinking_level: str = "minimal"

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["http://localhost:5173"])
    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("gemini_api_key")
    @classmethod
    def _strip_key(cls, value: str) -> str:
        # Pasted keys often carry stray spaces or quotes, which Google rejects as invalid.
        return value.strip().strip("'\"")

    @field_validator("gemini_timeout_seconds")
    @classmethod
    def _min_timeout(cls, value: float) -> float:
        return max(value, 10.0)

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
