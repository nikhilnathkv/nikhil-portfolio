"""Admin media management (metadata only for now)."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_media_service
from app.schemas.common import SuccessResponse, success
from app.schemas.media import MediaResponse
from app.services.media import MediaService

router = APIRouter(prefix="/media", tags=["Admin: Media"])


@router.get("", response_model=SuccessResponse[list[MediaResponse]], summary="List media")
async def list_media(
    service: MediaService = Depends(get_media_service),
) -> SuccessResponse[list[MediaResponse]]:
    items = await service.list_media()
    return success([MediaResponse.model_validate(m) for m in items])


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete media")
async def delete_media(
    media_id: uuid.UUID, service: MediaService = Depends(get_media_service)
) -> None:
    await service.delete_media(media_id)
