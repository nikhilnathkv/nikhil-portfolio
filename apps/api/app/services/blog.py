"""Blog business logic and lifecycle (draft → published → archived)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.models.blog import BlogPost
from app.models.enums import ContentStatus
from app.repositories.blog import BlogFilters, BlogRepository
from app.repositories.pagination import Page, PageRequest
from app.schemas.blog import BlogPostCreate, BlogPostUpdate
from app.services._helpers import mark_archived, mark_published, require_publishable, resolve_slug

PUBLISH_REQUIRED_FIELDS = ["title", "slug", "excerpt", "content", "category"]


class BlogService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = BlogRepository(session)

    # --- public reads -------------------------------------------------------
    async def list(self, *, published_only: bool = True) -> list[BlogPost]:
        if published_only:
            return await self.repo.get_published()
        return await self.list_posts()

    async def list_public(
        self,
        *,
        category: str | None = None,
        tag: str | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[BlogPost]:
        return await self.repo.search_published(category=category, tag=tag, pagination=pagination)

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> BlogPost:
        post = await self.repo.get_by_slug(slug)
        if post is None or (published_only and post.status != ContentStatus.PUBLISHED):
            raise ResourceNotFoundError(f"Blog post '{slug}' not found")
        return post

    # --- admin reads --------------------------------------------------------
    async def get_post(self, post_id: uuid.UUID) -> BlogPost:
        post = await self.repo.get_by_id(post_id)
        if post is None:
            raise ResourceNotFoundError("Blog post not found")
        return post

    async def list_posts(self) -> list[BlogPost]:
        return await self.repo.list(order_by=(BlogPost.created_at.desc(),))

    async def search(
        self, *, filters: BlogFilters | None = None, pagination: PageRequest | None = None
    ) -> Page[BlogPost]:
        return await self.repo.search(filters=filters, pagination=pagination)

    # --- writes -------------------------------------------------------------
    async def create_post(self, data: BlogPostCreate) -> BlogPost:
        slug = await resolve_slug(self.repo, data.slug, data.title)
        post = BlogPost(
            **data.model_dump(exclude={"slug", "status", "tags"}),
            slug=slug,
            status=ContentStatus.DRAFT,
        )
        post.tags = await self.repo.get_or_create_tags(data.tags)
        if data.status == ContentStatus.PUBLISHED:
            require_publishable(post, PUBLISH_REQUIRED_FIELDS)
            mark_published(post)
        self.session.add(post)
        await self.session.commit()
        return await self.get_post(post.id)

    async def update_post(self, post_id: uuid.UUID, data: BlogPostUpdate) -> BlogPost:
        post = await self.get_post(post_id)
        values = data.model_dump(exclude_unset=True, exclude={"tags"})
        if values.get("slug") and await self.repo.exists_by_slug(
            values["slug"], exclude_id=post.id
        ):
            raise DuplicateResourceError(f"Slug '{values['slug']}' is already in use")
        for key, value in values.items():
            setattr(post, key, value)
        if data.tags is not None:
            post.tags = await self.repo.get_or_create_tags(data.tags)
        await self.session.commit()
        return await self.get_post(post.id)

    async def publish_post(self, post_id: uuid.UUID) -> BlogPost:
        post = await self.get_post(post_id)
        require_publishable(post, PUBLISH_REQUIRED_FIELDS)
        mark_published(post)
        await self.session.commit()
        return await self.get_post(post.id)

    async def unpublish_post(self, post_id: uuid.UUID) -> BlogPost:
        post = await self.get_post(post_id)
        post.status = ContentStatus.DRAFT
        await self.session.commit()
        return await self.get_post(post.id)

    async def archive_post(self, post_id: uuid.UUID) -> BlogPost:
        post = await self.get_post(post_id)
        mark_archived(post)
        await self.session.commit()
        return await self.get_post(post.id)

    async def duplicate_post(self, post_id: uuid.UUID) -> BlogPost:
        source = await self.get_post(post_id)
        new_title = f"{source.title} (Copy)"
        new_slug = await resolve_slug(self.repo, None, new_title)
        copy = BlogPost(
            title=new_title,
            slug=new_slug,
            excerpt=source.excerpt,
            content=source.content,
            cover_image_id=source.cover_image_id,
            category=source.category,
            featured=False,
            seo_title=source.seo_title,
            seo_description=source.seo_description,
            status=ContentStatus.DRAFT,
        )
        copy.tags = list(source.tags)
        self.session.add(copy)
        await self.session.commit()
        return await self.get_post(copy.id)

    async def delete_post(self, post_id: uuid.UUID) -> None:
        post = await self.get_post(post_id)
        await self.repo.delete(post)
        await self.session.commit()
