"""Admin experience management."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_experience_service
from app.schemas.common import SuccessResponse, success
from app.schemas.experience import ExperienceCreate, ExperienceResponse, ExperienceUpdate
from app.services.experience import ExperienceService

router = APIRouter(prefix="/experience", tags=["Admin: Experience"])


@router.get("", response_model=SuccessResponse[list[ExperienceResponse]], summary="List experience")
async def list_experience(
    service: ExperienceService = Depends(get_experience_service),
) -> SuccessResponse[list[ExperienceResponse]]:
    items = await service.list_experience()
    return success([ExperienceResponse.model_validate(i) for i in items])


@router.post(
    "",
    response_model=SuccessResponse[ExperienceResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create experience",
)
async def create_experience(
    payload: ExperienceCreate, service: ExperienceService = Depends(get_experience_service)
) -> SuccessResponse[ExperienceResponse]:
    return success(ExperienceResponse.model_validate(await service.create_experience(payload)))


@router.get(
    "/{experience_id}", response_model=SuccessResponse[ExperienceResponse], summary="Get experience"
)
async def get_experience(
    experience_id: uuid.UUID, service: ExperienceService = Depends(get_experience_service)
) -> SuccessResponse[ExperienceResponse]:
    return success(ExperienceResponse.model_validate(await service.get_experience(experience_id)))


@router.put(
    "/{experience_id}",
    response_model=SuccessResponse[ExperienceResponse],
    summary="Update experience",
)
async def update_experience(
    experience_id: uuid.UUID,
    payload: ExperienceUpdate,
    service: ExperienceService = Depends(get_experience_service),
) -> SuccessResponse[ExperienceResponse]:
    updated = await service.update_experience(experience_id, payload)
    return success(ExperienceResponse.model_validate(updated))


@router.delete(
    "/{experience_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete experience"
)
async def delete_experience(
    experience_id: uuid.UUID, service: ExperienceService = Depends(get_experience_service)
) -> None:
    await service.delete_experience(experience_id)
