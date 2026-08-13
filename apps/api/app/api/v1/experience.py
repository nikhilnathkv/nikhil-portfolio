"""Experience endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse, success
from app.schemas.experience import ExperienceListResponse, ExperienceResponse
from app.services.misc import ExperienceService

router = APIRouter(prefix="/experience", tags=["experience"])


@router.get("", response_model=SuccessResponse[list[ExperienceListResponse]])
async def list_experience(
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[ExperienceListResponse]]:
    items = await ExperienceService(db).list()
    return success([ExperienceListResponse.model_validate(i) for i in items])


@router.get("/{experience_id}", response_model=SuccessResponse[ExperienceResponse])
async def get_experience(
    experience_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ExperienceResponse]:
    item = await ExperienceService(db).get(experience_id)
    return success(ExperienceResponse.model_validate(item))
