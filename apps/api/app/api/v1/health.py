"""Health endpoints: liveness (`/health`) and readiness (`/health/ready`)."""

from typing import Literal

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text

from app import __version__
from app.core.database import engine
from app.schemas.common import SuccessResponse, success

router = APIRouter(tags=["Health"])


class HealthStatus(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    db: Literal["up", "down"]


async def _check_db() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@router.get("/health", response_model=SuccessResponse[HealthStatus], summary="Liveness probe")
async def health() -> SuccessResponse[HealthStatus]:
    db_up = await _check_db()
    payload = HealthStatus(
        status="ok" if db_up else "degraded",
        service="nikhil-portfolio-api",
        version=__version__,
        db="up" if db_up else "down",
    )
    return success(payload)


@router.get("/health/ready", summary="Readiness probe (checks dependencies)")
async def readiness() -> JSONResponse:
    """Returns 200 only when required dependencies (the database) are reachable."""
    db_up = await _check_db()
    status_code = 200 if db_up else 503
    return JSONResponse(
        status_code=status_code,
        content={"data": {"ready": db_up, "db": "up" if db_up else "down"}},
    )
