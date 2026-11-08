import logging

from fastapi import APIRouter

from app.db import get_supabase
from app.repositories.families import SupabaseFamilyRepository
from app.schemas.common import Health

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/health", response_model=Health)
def health() -> Health:
    client = get_supabase()
    if client is None:
        return Health(status="degraded", database="not_configured")
    try:
        SupabaseFamilyRepository(client).ping()
    except Exception:  # noqa: BLE001 - any DB failure means degraded
        logger.exception("Database health check failed")
        return Health(status="degraded", database="error")
    return Health(status="ok", database="ok")
