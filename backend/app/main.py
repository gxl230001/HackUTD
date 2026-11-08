"""CloseGuard API entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import family, health
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    app = FastAPI(
        title="CloseGuard API",
        version="0.1.0",
        description="Family scam-awareness analytics. Demo data is synthetic; not connected to T-Mobile.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(health.router, prefix="/api")
    app.include_router(family.router, prefix="/api")
    return app


app = create_app()
