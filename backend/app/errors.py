"""Consistent JSON errors and request logging.

Every error response has the shape {"detail": "<human-readable message>"} so the
frontend can show it directly. Validation errors also carry "errors" with the
field-level details. Internal details are logged, never returned.
"""

import logging
import time
import uuid

import httpx
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError as PostgrestAPIError

logger = logging.getLogger("closeguard.api")


def _field(loc: tuple) -> str:
    parts = [str(p) for p in loc if p not in ("query", "path", "body")]
    return ".".join(parts) or "request"


def install(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled error [%s] %s %s", request_id, request.method, request.url.path)
            response = JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Something went wrong on our side. Please try again."},
            )
        elapsed_ms = (time.perf_counter() - started) * 1000
        # Path only: query strings are not logged.
        logger.info("%s %s -> %s (%.0f ms) [%s]", request.method, request.url.path, response.status_code, elapsed_ms, request_id)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [{"field": _field(tuple(e.get("loc", ()))), "message": e.get("msg", "Invalid value")} for e in exc.errors()]
        first = errors[0] if errors else {"field": "request", "message": "Invalid request"}
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={"detail": f"Invalid {first['field']}: {first['message']}.", "errors": errors},
        )

    @app.exception_handler(PostgrestAPIError)
    async def database_error(request: Request, exc: PostgrestAPIError) -> JSONResponse:
        logger.error("Database error on %s: %s", request.url.path, getattr(exc, "message", exc))
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            content={"detail": "The data service is unavailable. Please try again shortly."})

    @app.exception_handler(httpx.HTTPError)
    async def upstream_error(request: Request, exc: httpx.HTTPError) -> JSONResponse:
        logger.error("Upstream connection error on %s: %s", request.url.path, type(exc).__name__)
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            content={"detail": "The data service is unavailable. Please try again shortly."})
