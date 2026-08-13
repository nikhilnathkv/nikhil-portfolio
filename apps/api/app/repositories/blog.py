"""Blog data access."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.blog import BlogPost, BlogTag
from app.repositories.base import BaseRepository


class BlogRepository(BaseRepository[BlogPost]):
    model = BlogPost

    async def get_by_slug(self, slug: str, *, include_deleted: bool = False) -> BlogPost | None:
        stmt = self._base_select(include_deleted).where(BlogPost.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(BlogPost.id).where(BlogPost.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(BlogPost.id != exclude_id)
        return (await self.session.execute(stmt)).first() is not None

    async def get_or_create_tags(self, names: list[str]) -> list[BlogTag]:
        tags: list[BlogTag] = []
        for name in names:
            existing = await self.session.execute(select(BlogTag).where(BlogTag.name == name))
            tag = existing.scalar_one_or_none()
            if tag is None:
                tag = BlogTag(name=name)
                self.session.add(tag)
                await self.session.flush()
            tags.append(tag)
        return tags
