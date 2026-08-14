"""Admin dashboard summary."""

from fastapi import APIRouter, Depends

from app.api.deps import get_dashboard_service
from app.schemas.common import SuccessResponse, success
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Admin: Dashboard"])


@router.get("", response_model=SuccessResponse[dict], summary="Dashboard counts")
async def dashboard(
    service: DashboardService = Depends(get_dashboard_service),
) -> SuccessResponse[dict]:
    return success(await service.summary())
