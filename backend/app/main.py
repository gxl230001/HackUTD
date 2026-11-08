"""Owlert API entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, family, health
from app import errors
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    app = FastAPI(
        title="Owlert API",
        version="1.0.0",
        description="Family scam-awareness analytics.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Request-ID"],
    )
    errors.install(app)
    app.include_router(health.router, prefix="/api")
    app.include_router(family.router, prefix="/api")
    app.include_router(analytics.router, prefix="/api")
    return app


app = create_app()
