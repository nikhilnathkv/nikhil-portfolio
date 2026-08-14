"""Experiment endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.experiment import ExperimentListResponse, ExperimentResponse
from app.services.experiment import ExperimentService

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=SuccessResponse[list[ExperimentListResponse]])
async def list_experiments(
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[ExperimentListResponse]]:
    items = await ExperimentService(db).list()
    return success([ExperimentListResponse.model_validate(i) for i in items])


@router.get("/{slug}", response_model=SuccessResponse[ExperimentResponse])
async def get_experiment(
    slug: str, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ExperimentResponse]:
    item = await ExperimentService(db).get_by_slug(slug)
    return success(ExperimentResponse.model_validate(item))
