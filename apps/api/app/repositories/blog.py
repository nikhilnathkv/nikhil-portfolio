"""Blog data access."""

from __future__ import annotations

from sqlalchemy import select

from app.models.blog import BlogPost, BlogTag
from app.models.enums import ContentStatus
from app.repositories.base import SlugRepository

DEFAULT_BLOG_ORDER = (BlogPost.published_at.desc(), BlogPost.created_at.desc())


class BlogRepository(SlugRepository[BlogPost]):
    model = BlogPost

    async def get_published(self) -> list[BlogPost]:
        return await self.list(
            filters=[BlogPost.status == ContentStatus.PUBLISHED],
            order_by=DEFAULT_BLOG_ORDER,
        )

    async def get_featured(self, *, published_only: bool = True) -> list[BlogPost]:
        filters = [BlogPost.featured.is_(True)]
        if published_only:
            filters.append(BlogPost.status == ContentStatus.PUBLISHED)
        return await self.list(filters=filters, order_by=DEFAULT_BLOG_ORDER)

    async def list_by_status(self, status: ContentStatus) -> list[BlogPost]:
        return await self.list(filters=[BlogPost.status == status], order_by=DEFAULT_BLOG_ORDER)

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
