"""Research business logic and lifecycle."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.models.enums import ContentStatus
from app.models.research import Research
from app.repositories.pagination import Page, PageRequest
from app.repositories.project import ProjectRepository
from app.repositories.research import ResearchFilters, ResearchRepository
from app.schemas.research import ResearchCreate, ResearchUpdate
from app.services._helpers import mark_archived, mark_published, require_publishable, resolve_slug

# Kept intentionally lenient (title + abstract), not overly strict.
PUBLISH_REQUIRED_FIELDS = ["title", "slug", "abstract"]


class ResearchService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ResearchRepository(session)
        self.projects = ProjectRepository(session)

    async def list(
        self, *, published_only: bool = True, project_id: uuid.UUID | None = None
    ) -> list[Research]:
        if project_id is not None:
            filters = ResearchFilters(
                status=ContentStatus.PUBLISHED if published_only else None,
                project_id=project_id,
            )
            page = await self.repo.search(filters=filters, pagination=PageRequest(page_size=100))
            return page.items
        if published_only:
            return await self.repo.get_published()
        return await self.repo.list(order_by=(Research.created_at.desc(),))

    async def search(
        self,
        *,
        filters: ResearchFilters | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[Research]:
        return await self.repo.search(filters=filters, pagination=pagination)

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Research:
        item = await self.repo.get_by_slug(slug)
        if item is None or (published_only and item.status != ContentStatus.PUBLISHED):
            raise ResourceNotFoundError(f"Research '{slug}' not found")
        return item

    async def get_research(self, research_id: uuid.UUID) -> Research:
        item = await self.repo.get_by_id(research_id)
        if item is None:
            raise ResourceNotFoundError("Research not found")
        return item

    async def create_research(self, data: ResearchCreate) -> Research:
        await self._validate_project(data.project_id)
        slug = await resolve_slug(self.repo, data.slug, data.title)
        item = Research(
            **data.model_dump(exclude={"slug", "status"}),
            slug=slug,
            status=ContentStatus.DRAFT,
        )
        if data.status == ContentStatus.PUBLISHED:
            require_publishable(item, PUBLISH_REQUIRED_FIELDS)
            mark_published(item)
        self.session.add(item)
        await self.session.commit()
        return await self.get_research(item.id)

    async def update_research(self, research_id: uuid.UUID, data: ResearchUpdate) -> Research:
        item = await self.get_research(research_id)
        values = data.model_dump(exclude_unset=True)
        if "project_id" in values:
            await self._validate_project(values["project_id"])
        if values.get("slug") and await self.repo.exists_by_slug(
            values["slug"], exclude_id=item.id
        ):
            raise DuplicateResourceError(f"Slug '{values['slug']}' is already in use")
        for key, value in values.items():
            setattr(item, key, value)
        await self.session.commit()
        return await self.get_research(item.id)

    async def publish_research(self, research_id: uuid.UUID) -> Research:
        item = await self.get_research(research_id)
        require_publishable(item, PUBLISH_REQUIRED_FIELDS)
        mark_published(item)
        await self.session.commit()
        return await self.get_research(item.id)

    async def unpublish_research(self, research_id: uuid.UUID) -> Research:
        item = await self.get_research(research_id)
        item.status = ContentStatus.DRAFT
        await self.session.commit()
        return await self.get_research(item.id)

    async def archive_research(self, research_id: uuid.UUID) -> Research:
        item = await self.get_research(research_id)
        mark_archived(item)
        await self.session.commit()
        return await self.get_research(item.id)

    async def duplicate_research(self, research_id: uuid.UUID) -> Research:
        source = await self.get_research(research_id)
        new_title = f"{source.title} (Copy)"
        new_slug = await resolve_slug(self.repo, None, new_title)
        copy = Research(
            title=new_title,
            slug=new_slug,
            abstract=source.abstract,
            methodology=source.methodology,
            results=source.results,
            conclusion=source.conclusion,
            paper_url=source.paper_url,
            publication_url=source.publication_url,
            github_url=source.github_url,
            project_id=source.project_id,
            status=ContentStatus.DRAFT,
        )
        self.session.add(copy)
        await self.session.commit()
        return await self.get_research(copy.id)

    async def delete_research(self, research_id: uuid.UUID) -> None:
        item = await self.get_research(research_id)
        await self.repo.delete(item)
        await self.session.commit()

    async def _validate_project(self, project_id: uuid.UUID | None) -> None:
        if project_id is not None and await self.projects.get_by_id(project_id) is None:
            raise ResourceNotFoundError(f"Project {project_id} does not exist")
