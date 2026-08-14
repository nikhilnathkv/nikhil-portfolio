"""Contact-message business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BusinessRuleViolationError,
    InvalidStateTransitionError,
    ResourceNotFoundError,
)
from app.models.contact_message import ContactMessage
from app.models.enums import ContactStatus
from app.repositories.contact import ContactMessageRepository
from app.schemas.contact import ContactMessageCreate


class ContactService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ContactMessageRepository(session)

    # --- public -------------------------------------------------------------
    async def submit_contact_message(self, data: ContactMessageCreate) -> ContactMessage:
        name = data.name.strip()
        message = data.message.strip()
        if not message:
            raise BusinessRuleViolationError("Message cannot be empty")
        contact = ContactMessage(
            name=name,
            email=str(data.email).strip().lower(),
            message=message,
            status=ContactStatus.UNREAD,  # default
        )
        self.session.add(contact)
        await self.session.commit()
        await self.session.refresh(contact)
        return contact

    # --- admin --------------------------------------------------------------
    async def list_messages(self, *, status: ContactStatus | None = None) -> list[ContactMessage]:
        return await self.repo.list_recent(status=status)

    async def get_message(self, message_id: uuid.UUID) -> ContactMessage:
        message = await self.repo.get_by_id(message_id)
        if message is None:
            raise ResourceNotFoundError("Message not found")
        return message

    async def mark_read(self, message_id: uuid.UUID) -> ContactMessage:
        message = await self.get_message(message_id)
        if message.status is ContactStatus.ARCHIVED:
            raise InvalidStateTransitionError("Cannot mark an archived message as read")
        await self.repo.mark_read(message)
        await self.session.commit()
        return await self.get_message(message.id)

    async def archive_message(self, message_id: uuid.UUID) -> ContactMessage:
        message = await self.get_message(message_id)
        await self.repo.archive(message)
        await self.session.commit()
        return await self.get_message(message.id)

    async def delete_message(self, message_id: uuid.UUID) -> None:
        message = await self.get_message(message_id)
        await self.repo.delete(message)
        await self.session.commit()

    async def unread_count(self) -> int:
        return await self.repo.get_unread_count()
