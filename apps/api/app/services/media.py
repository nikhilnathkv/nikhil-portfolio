"""Media business logic: object-storage uploads + metadata + usage tracking."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BusinessRuleViolationError, ResourceNotFoundError
from app.models.blog import BlogPost
from app.models.media import Media
from app.models.profile import Profile
from app.repositories.media import MediaRepository
from app.schemas.media import MediaUpdate, MediaUsage, MediaUsageItem
from app.services.storage import StorageService, get_storage_service

# Allowed upload types (spec: images + PDF; no video).
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
}


class MediaService:
    def __init__(self, session: AsyncSession, storage: StorageService | None = None) -> None:
        self.session = session
        self.repo = MediaRepository(session)
        self.storage = storage or get_storage_service()

    async def get_media(self, media_id: uuid.UUID) -> Media:
        media = await self.repo.get_by_id(media_id)
        if media is None:
            raise ResourceNotFoundError("Media not found")
        return media

    async def list_media(self) -> list[Media]:
        return await self.repo.list_recent()

    async def upload_media(
        self,
        *,
        data: bytes,
        original_filename: str,
        content_type: str,
        alt_text: str | None = None,
    ) -> Media:
        if content_type not in ALLOWED_MIME_TYPES:
            raise BusinessRuleViolationError(
                f"Unsupported file type '{content_type}'. Allowed: images and PDF."
            )
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise BusinessRuleViolationError(f"File exceeds the {settings.max_upload_mb} MB limit.")

        key = self.storage.build_key(original_filename)
        url = self.storage.upload(data, key, content_type)

        media = Media(
            filename=key,
            original_filename=original_filename,
            mime_type=content_type,
            size=len(data),
            storage_key=key,
            url=url,
            alt_text=alt_text,
        )
        self.session.add(media)
        await self.session.commit()
        await self.session.refresh(media)
        return media

    async def update_metadata(self, media_id: uuid.UUID, data: MediaUpdate) -> Media:
        media = await self.get_media(media_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(media, key, value)
        await self.session.commit()
        await self.session.refresh(media)
        return media

    async def usage(self, media_id: uuid.UUID) -> MediaUsage:
        await self.get_media(media_id)  # 404 if missing
        items: list[MediaUsageItem] = []

        profiles = (
            (
                await self.session.execute(
                    select(Profile).where(Profile.profile_image_id == media_id)
                )
            )
            .scalars()
            .all()
        )
        for p in profiles:
            items.append(MediaUsageItem(kind="profile", label=f"{p.name} (profile image)"))

        posts = (
            (
                await self.session.execute(
                    select(BlogPost).where(
                        BlogPost.cover_image_id == media_id, BlogPost.deleted_at.is_(None)
                    )
                )
            )
            .scalars()
            .all()
        )
        for post in posts:
            items.append(MediaUsageItem(kind="blog", label=post.title, slug=post.slug))

        return MediaUsage(count=len(items), items=items)

    async def delete_media(self, media_id: uuid.UUID, *, force: bool = False) -> None:
        media = await self.get_media(media_id)
        usage = await self.usage(media_id)
        if usage.count and not force:
            raise BusinessRuleViolationError(
                f"Media is used by {usage.count} piece(s) of content; pass force to delete anyway"
            )
        # Remove the object first; if that fails we keep the metadata row.
        try:
            self.storage.delete(media.storage_key)
        except Exception:  # noqa: BLE001 — best-effort; row removal still proceeds
            pass
        await self.repo.delete(media)
        await self.session.commit()

    # Retained for the earlier programmatic flow / seeds.
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
