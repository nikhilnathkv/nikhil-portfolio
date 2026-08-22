"""FastAPI application entrypoint.

Wires configuration, CORS, the standardized error envelope, and the versioned
API router. Run with:  uvicorn app.main:app --reload
"""

import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Ensure the object-storage bucket exists (best-effort: the app must still
    # start when MinIO is unavailable, e.g. in unit tests).
    try:
        from app.services.storage import get_storage_service

        get_storage_service().ensure_bucket()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Object storage not ready at startup: %s", exc)
    yield


TAGS_METADATA = [
    {"name": "Profile", "description": "Public site-owner profile."},
    {"name": "Experience", "description": "Work experience, most recent first."},
    {"name": "Projects", "description": "Published projects, filtering, and detail pages."},
    {"name": "Skills", "description": "Skill categories with their skills."},
    {"name": "Blog", "description": "Published blog posts."},
    {"name": "Research", "description": "Published research."},
    {"name": "Experiments", "description": "Published experiments."},
    {"name": "Repositories", "description": "GitHub repository metadata."},
    {"name": "Resume", "description": "The active resume."},
    {"name": "Contact", "description": "Submit a contact message (public write)."},
    {"name": "Health", "description": "Liveness and readiness probes."},
]


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        version=__version__,
        description=(
            "Public, versioned, read-only API for the portfolio. All responses use "
            "the `{data, meta}` / `{error}` envelope. Drafts are never exposed."
        ),
        openapi_tags=TAGS_METADATA,
        # Interactive docs + the OpenAPI schema are disabled in production to
        # avoid exposing the full API surface publicly; enabled everywhere else.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
        """Attach a request id and log one structured line per request.

        Deliberately logs only non-sensitive metadata — never bodies, cookies,
        tokens, or credentials.
        """
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = round((time.perf_counter() - start) * 1000, 1)
        response.headers["x-request-id"] = request_id
        logger.info(
            "request_id=%s method=%s path=%s status=%s latency_ms=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            latency_ms,
        )
        return response

    _register_exception_handlers(app)

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"service": settings.project_name, "docs": "/docs"}

    return app


def _register_exception_handlers(app: FastAPI) -> None:
    """Coerce all errors into the standard {"error": {...}} envelope."""

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _status_to_code(exc.status_code)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": code, "message": str(exc.detail)}},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        details: dict[str, list[str]] = {}
        for error in exc.errors():
            location = ".".join(str(part) for part in error["loc"][1:]) or "body"
            details.setdefault(location, []).append(error["msg"])
        # Field names + messages only (no submitted values) for server-side visibility.
        logging.getLogger("app").warning("Request validation failed: %s", details)
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": details,
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        # Log the full error server-side; never leak the message/stack to clients.
        logging.getLogger("app").exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}},
        )


def _status_to_code(status_code: int) -> str:
    mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
    }
    return mapping.get(status_code, "ERROR")


app = create_app()
