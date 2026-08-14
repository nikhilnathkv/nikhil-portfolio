"""Contact-message schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ContactStatus
from app.schemas.base import ORMModel


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    message: str = Field(min_length=1)


class ContactMessageResponse(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    message: str
    status: ContactStatus
    created_at: datetime
    read_at: datetime | None = None


class ContactAck(BaseModel):
    """Public acknowledgement — deliberately does not echo stored data back."""

    message: str = "Message received successfully."
