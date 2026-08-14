"""Admin contact-message management."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_contact_service
from app.schemas.common import SuccessResponse, success
from app.schemas.contact import ContactMessageResponse
from app.services.contact import ContactService

router = APIRouter(prefix="/messages", tags=["Admin: Messages"])


@router.get(
    "", response_model=SuccessResponse[list[ContactMessageResponse]], summary="List messages"
)
async def list_messages(
    service: ContactService = Depends(get_contact_service),
) -> SuccessResponse[list[ContactMessageResponse]]:
    items = await service.list_messages()
    return success([ContactMessageResponse.model_validate(m) for m in items])


@router.get(
    "/{message_id}", response_model=SuccessResponse[ContactMessageResponse], summary="Get a message"
)
async def get_message(
    message_id: uuid.UUID, service: ContactService = Depends(get_contact_service)
) -> SuccessResponse[ContactMessageResponse]:
    return success(ContactMessageResponse.model_validate(await service.get_message(message_id)))


@router.post(
    "/{message_id}/read",
    response_model=SuccessResponse[ContactMessageResponse],
    summary="Mark read",
)
async def mark_read(
    message_id: uuid.UUID, service: ContactService = Depends(get_contact_service)
) -> SuccessResponse[ContactMessageResponse]:
    return success(ContactMessageResponse.model_validate(await service.mark_read(message_id)))


@router.post(
    "/{message_id}/archive",
    response_model=SuccessResponse[ContactMessageResponse],
    summary="Archive",
)
async def archive_message(
    message_id: uuid.UUID, service: ContactService = Depends(get_contact_service)
) -> SuccessResponse[ContactMessageResponse]:
    return success(ContactMessageResponse.model_validate(await service.archive_message(message_id)))


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a message")
async def delete_message(
    message_id: uuid.UUID, service: ContactService = Depends(get_contact_service)
) -> None:
    await service.delete_message(message_id)
