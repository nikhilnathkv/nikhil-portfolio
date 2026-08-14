"""Experience endpoints (most recent first)."""

import uuid

from fastapi import APIRouter, Depends

from app.api.deps import get_experience_service
from app.schemas.common import SuccessResponse, success
from app.schemas.experience import ExperienceListResponse, ExperienceResponse
from app.services.experience import ExperienceService

router = APIRouter(prefix="/experience", tags=["Experience"])


@router.get(
    "",
    response_model=SuccessResponse[list[ExperienceListResponse]],
    summary="List experience, most recent first",
)
async def list_experience(
    service: ExperienceService = Depends(get_experience_service),
) -> SuccessResponse[list[ExperienceListResponse]]:
    items = await service.list_experience()
    return success([ExperienceListResponse.model_validate(i) for i in items])


@router.get(
    "/{experience_id}",
    response_model=SuccessResponse[ExperienceResponse],
    summary="Get a single experience entry",
)
async def get_experience(
    experience_id: uuid.UUID,
    service: ExperienceService = Depends(get_experience_service),
) -> SuccessResponse[ExperienceResponse]:
    item = await service.get_experience(experience_id)
    return success(ExperienceResponse.model_validate(item))
