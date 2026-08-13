"""Health / liveness endpoint (M1.9).

Reports that the API process is up. Database readiness is reported separately as
`db` so a failed database connection does not mark the whole service down — the
public site can still render while the DB is temporarily unavailable.
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app import __version__
from app.core.database import engine
from app.schemas.common import SuccessResponse, success

router = APIRouter(tags=["health"])


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
