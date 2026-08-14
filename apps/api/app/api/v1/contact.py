"""Contact endpoint — the only public write endpoint.

Submitting a message never exposes stored data; there is no public GET (admin
access to messages arrives in M2.7).
"""

from fastapi import APIRouter, Depends, status

from app.api.deps import get_contact_service
from app.schemas.common import SuccessResponse, success
from app.schemas.contact import ContactAck, ContactMessageCreate
from app.services.contact import ContactService

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post(
    "",
    response_model=SuccessResponse[ContactAck],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a contact message",
)
async def submit_contact(
    payload: ContactMessageCreate,
    service: ContactService = Depends(get_contact_service),
) -> SuccessResponse[ContactAck]:
    await service.submit_contact_message(payload)
    return success(ContactAck())
