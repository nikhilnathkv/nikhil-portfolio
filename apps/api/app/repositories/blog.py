"""Blog data access."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, or_, select

from app.models.blog import BlogPost, BlogTag, blog_post_tags
from app.models.enums import ContentStatus
from app.repositories.base import SlugRepository
from app.repositories.pagination import Page, PageRequest

DEFAULT_BLOG_ORDER = (BlogPost.published_at.desc(), BlogPost.created_at.desc())


@dataclass
class BlogFilters:
    status: ContentStatus | None = None
    category: str | None = None
    tag: str | None = None
    search: str | None = None


class BlogRepository(SlugRepository[BlogPost]):
    model = BlogPost

    async def get_published(self) -> list[BlogPost]:
        return await self.list(
            filters=[BlogPost.status == ContentStatus.PUBLISHED],
            order_by=DEFAULT_BLOG_ORDER,
        )

    async def search(
        self, *, filters: BlogFilters | None = None, pagination: PageRequest | None = None
    ) -> Page[BlogPost]:
        """Admin listing across all statuses, filtered + paginated."""
        filters = filters or BlogFilters()
        pagination = pagination or PageRequest()
        base = self._base_select()
        if filters.status is not None:
            base = base.where(BlogPost.status == filters.status)
        if filters.category is not None:
            base = base.where(BlogPost.category == filters.category)
        if filters.search:
            like = f"%{filters.search}%"
            base = base.where(or_(BlogPost.title.ilike(like), BlogPost.excerpt.ilike(like)))
        if filters.tag is not None:
            base = (
                base.join(blog_post_tags, BlogPost.id == blog_post_tags.c.blog_post_id)
                .join(BlogTag, BlogTag.id == blog_post_tags.c.tag_id)
                .where(BlogTag.name.ilike(filters.tag))
            )

        id_subquery = base.order_by(None).with_only_columns(BlogPost.id).distinct().subquery()
        total = int(
            (await self.session.execute(select(func.count()).select_from(id_subquery))).scalar_one()
        )
        stmt = (
            base.order_by(BlogPost.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = list((await self.session.execute(stmt)).scalars().unique().all())
        return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)

    async def search_published(
        self,
        *,
        category: str | None = None,
        tag: str | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[BlogPost]:
        pagination = pagination or PageRequest()
        base = self._base_select().where(BlogPost.status == ContentStatus.PUBLISHED)
        if category is not None:
            base = base.where(BlogPost.category == category)
        if tag is not None:
            base = (
                base.join(blog_post_tags, BlogPost.id == blog_post_tags.c.blog_post_id)
                .join(BlogTag, BlogTag.id == blog_post_tags.c.tag_id)
                .where(BlogTag.name.ilike(tag))
            )

        id_subquery = base.order_by(None).with_only_columns(BlogPost.id).distinct().subquery()
        total = int(
            (await self.session.execute(select(func.count()).select_from(id_subquery))).scalar_one()
        )

        stmt = base.order_by(*DEFAULT_BLOG_ORDER).offset(pagination.offset).limit(pagination.limit)
        items = list((await self.session.execute(stmt)).scalars().unique().all())
        return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)

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
