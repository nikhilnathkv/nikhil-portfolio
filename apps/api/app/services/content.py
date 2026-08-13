"""Services for slug-based content: blog, research, experiments.

Public reads only expose published content; drafts/archived are hidden.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.blog import BlogPost
from app.models.enums import ContentStatus
from app.models.experiment import Experiment
from app.models.research import Research
from app.repositories.blog import BlogRepository
from app.repositories.content import ExperimentRepository, ResearchRepository


class BlogService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = BlogRepository(session)

    async def list(self, *, published_only: bool = True) -> list[BlogPost]:
        filters = [BlogPost.status == ContentStatus.PUBLISHED] if published_only else []
        return await self.repo.list(filters=filters, order_by=BlogPost.published_at.desc())

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> BlogPost:
        post = await self.repo.get_by_slug(slug)
        if post is None or (published_only and post.status != ContentStatus.PUBLISHED):
            raise NotFoundError(f"Blog post '{slug}' not found")
        return post


class ResearchService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ResearchRepository(session)

    async def list(self, *, published_only: bool = True) -> list[Research]:
        filters = [Research.status == ContentStatus.PUBLISHED] if published_only else []
        return await self.repo.list(filters=filters, order_by=Research.published_at.desc())

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Research:
        item = await self.repo.get_by_slug(slug)
        if item is None or (published_only and item.status != ContentStatus.PUBLISHED):
            raise NotFoundError(f"Research '{slug}' not found")
        return item


class ExperimentService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ExperimentRepository(session)

    async def list(self, *, published_only: bool = True) -> list[Experiment]:
        filters = [Experiment.status == ContentStatus.PUBLISHED] if published_only else []
        return await self.repo.list(filters=filters, order_by=Experiment.created_at.desc())

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Experiment:
        item = await self.repo.get_by_slug(slug)
        if item is None or (published_only and item.status != ContentStatus.PUBLISHED):
            raise NotFoundError(f"Experiment '{slug}' not found")
        return item
