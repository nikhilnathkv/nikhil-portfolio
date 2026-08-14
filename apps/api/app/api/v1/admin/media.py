"""Admin media management: object-storage uploads + metadata + usage."""

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from app.api.deps import get_media_service
from app.schemas.common import SuccessResponse, success
from app.schemas.media import MediaResponse, MediaUpdate, MediaUsage
from app.services.media import MediaService

router = APIRouter(prefix="/media", tags=["Admin: Media"])


@router.get("", response_model=SuccessResponse[list[MediaResponse]], summary="List media")
async def list_media(
    service: MediaService = Depends(get_media_service),
) -> SuccessResponse[list[MediaResponse]]:
    items = await service.list_media()
    return success([MediaResponse.model_validate(m) for m in items])


@router.post(
    "",
    response_model=SuccessResponse[MediaResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a media file",
)
async def upload_media(
    file: UploadFile = File(...),
    alt_text: str | None = Form(default=None),
    service: MediaService = Depends(get_media_service),
) -> SuccessResponse[MediaResponse]:
    data = await file.read()
    media = await service.upload_media(
        data=data,
        original_filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        alt_text=alt_text,
    )
    return success(MediaResponse.model_validate(media))


@router.put("/{media_id}", response_model=SuccessResponse[MediaResponse], summary="Update metadata")
async def update_media(
    media_id: uuid.UUID,
    payload: MediaUpdate,
    service: MediaService = Depends(get_media_service),
) -> SuccessResponse[MediaResponse]:
    return success(MediaResponse.model_validate(await service.update_metadata(media_id, payload)))


@router.get(
    "/{media_id}/usage", response_model=SuccessResponse[MediaUsage], summary="Where media is used"
)
async def media_usage(
    media_id: uuid.UUID, service: MediaService = Depends(get_media_service)
) -> SuccessResponse[MediaUsage]:
    return success(await service.usage(media_id))


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete media")
async def delete_media(
    media_id: uuid.UUID,
    force: bool = Query(default=False, description="Delete even if referenced by content"),
    service: MediaService = Depends(get_media_service),
) -> None:
    await service.delete_media(media_id, force=force)
