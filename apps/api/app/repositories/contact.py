"""Contact-message data access."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select

from app.models.contact_message import ContactMessage
from app.models.enums import ContactStatus
from app.repositories.base import BaseRepository


class ContactMessageRepository(BaseRepository[ContactMessage]):
    model = ContactMessage

    async def list_recent(self, *, status: ContactStatus | None = None) -> list[ContactMessage]:
        filters = [ContactMessage.status == status] if status is not None else []
        return await self.list(filters=filters, order_by=ContactMessage.created_at.desc())

    async def mark_read(self, message: ContactMessage) -> ContactMessage:
        message.status = ContactStatus.READ
        message.read_at = datetime.now(UTC)
        await self.session.flush()
        return message

    async def archive(self, message: ContactMessage) -> ContactMessage:
        message.status = ContactStatus.ARCHIVED
        await self.session.flush()
        return message

    async def get_unread_count(self) -> int:
        stmt = (
            select(func.count())
            .select_from(ContactMessage)
            .where(ContactMessage.status == ContactStatus.UNREAD)
        )
        return int((await self.session.execute(stmt)).scalar_one())
