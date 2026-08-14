"""Media metadata business logic.

Only the metadata/business layer for M2.5 — the object-storage upload flow is
built later (Admin/MediaService → object storage → this repository).
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.media import Media
from app.repositories.media import MediaRepository


class MediaService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = MediaRepository(session)

    async def get_media(self, media_id: uuid.UUID) -> Media:
        media = await self.repo.get_by_id(media_id)
        if media is None:
            raise ResourceNotFoundError("Media not found")
        return media

    async def list_media(self) -> list[Media]:
        return await self.repo.list_recent()

    async def create_media_record(
        self,
        *,
        filename: str,
        original_filename: str,
        mime_type: str,
        size: int,
        storage_key: str,
        url: str,
        alt_text: str | None = None,
    ) -> Media:
        media = Media(
            filename=filename,
            original_filename=original_filename,
            mime_type=mime_type,
            size=size,
            storage_key=storage_key,
            url=url,
            alt_text=alt_text,
        )
        self.session.add(media)
        await self.session.commit()
        await self.session.refresh(media)
        return media

    async def delete_media(self, media_id: uuid.UUID) -> None:
        media = await self.get_media(media_id)
        await self.repo.delete(media)
        await self.session.commit()
