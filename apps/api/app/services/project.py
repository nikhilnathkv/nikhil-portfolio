"""Project business logic and transaction orchestration."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.models.enums import ContentStatus
from app.models.project import Project, ProjectMetric
from app.repositories.pagination import Page, PageRequest
from app.repositories.project import ProjectFilters, ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services._helpers import (
    mark_archived,
    mark_published,
    require_publishable,
    resolve_slug,
)

# Fields that must be present before a project may be published.
PUBLISH_REQUIRED_FIELDS = ["title", "slug", "short_description", "description", "category"]


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProjectRepository(session)

    # --- reads --------------------------------------------------------------
    async def get_project(self, project_id: uuid.UUID) -> Project:
        project = await self.repo.get_by_id(project_id)
        if project is None:
            raise ResourceNotFoundError("Project not found")
        return project

    async def projects_using_skill(self, skill_id: uuid.UUID) -> list[Project]:
        """All projects referencing a given skill (for the admin usage indicator)."""
        return await self.repo.list_by_skill_id(skill_id)

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Project:
        project = await self.repo.get_by_slug(slug)
        if project is None or (published_only and project.status != ContentStatus.PUBLISHED):
            raise ResourceNotFoundError(f"Project '{slug}' not found")
        return project

    async def list(
        self,
        *,
        published_only: bool = True,
        featured: bool | None = None,
        category: str | None = None,
        skill: str | None = None,
    ) -> list[Project]:
        filters = ProjectFilters(
            status=ContentStatus.PUBLISHED if published_only else None,
            featured=featured,
            category=category,
            skill=skill,
        )
        page = await self.repo.search(filters=filters, pagination=PageRequest(page_size=100))
        return page.items

    async def search(
        self,
        *,
        filters: ProjectFilters | None = None,
        pagination: PageRequest | None = None,
        sort: str | None = None,
    ) -> Page[Project]:
        return await self.repo.search(filters=filters, pagination=pagination, sort=sort)

    async def list_public(
        self,
        *,
        featured: bool | None = None,
        category: str | None = None,
        skill: str | None = None,
        status: str | None = None,
        sort: str | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[Project]:
        """Public listing. Only PUBLISHED projects are ever returned, regardless
        of any client-supplied ``status`` — drafts/archived never leak."""
        pagination = pagination or PageRequest()
        if status is not None and status.lower() != ContentStatus.PUBLISHED.value:
            return Page(items=[], total=0, page=pagination.page, page_size=pagination.page_size)
        filters = ProjectFilters(
            status=ContentStatus.PUBLISHED,
            featured=featured,
            category=category,
            skill=skill,
        )
        return await self.repo.search(filters=filters, pagination=pagination, sort=sort)

    # --- writes (each method owns a single transaction) ---------------------
    async def create_project(self, data: ProjectCreate) -> Project:
        slug = await resolve_slug(self.repo, data.slug, data.title)

        project = Project(
            **data.model_dump(exclude={"slug", "skill_ids", "metrics", "status"}),
            slug=slug,
            status=ContentStatus.DRAFT,
        )
        # Relationships assigned on the transient instance before the first flush
        # (mutating a persistent relationship would trigger a sync lazy-load).
        project.skills = await self.repo.get_skills(data.skill_ids)
        project.metrics = [ProjectMetric(**m.model_dump()) for m in data.metrics]

        # Publishing at creation time runs the same rule as publish_project().
        if data.status == ContentStatus.PUBLISHED:
            require_publishable(project, PUBLISH_REQUIRED_FIELDS)
            mark_published(project)

        self.session.add(project)
        try:
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise
        return await self.get_project(project.id)

    async def update_project(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project:
        project = await self.get_project(project_id)
        values = data.model_dump(exclude_unset=True, exclude={"skill_ids", "metrics"})

        if values.get("slug") and await self.repo.exists_by_slug(
            values["slug"], exclude_id=project.id
        ):
            raise DuplicateResourceError(f"Slug '{values['slug']}' is already in use")

        if values.get("status") == ContentStatus.PUBLISHED and project.published_at is None:
            project.published_at = datetime.now(UTC)

        for key, value in values.items():
            setattr(project, key, value)

        if data.skill_ids is not None:
            project.skills = await self.repo.get_skills(data.skill_ids)

        if data.metrics is not None:
            # Replace the whole set; delete-orphan cascade removes the old rows.
            project.metrics = [ProjectMetric(**m.model_dump()) for m in data.metrics]

        await self.session.commit()
        return await self.get_project(project.id)

    async def delete_project(self, project_id: uuid.UUID) -> None:
        project = await self.get_project(project_id)
        await self.repo.delete(project)  # soft delete — preserves history
        await self.session.commit()

    async def publish_project(self, project_id: uuid.UUID) -> Project:
        project = await self.get_project(project_id)
        require_publishable(project, PUBLISH_REQUIRED_FIELDS)
        mark_published(project)  # DRAFT/ARCHIVED -> PUBLISHED (republish supported)
        await self.session.commit()
        return await self.get_project(project.id)

    async def unpublish_project(self, project_id: uuid.UUID) -> Project:
        project = await self.get_project(project_id)
        project.status = ContentStatus.DRAFT  # keeps published_at for a later republish
        await self.session.commit()
        return await self.get_project(project.id)

    async def archive_project(self, project_id: uuid.UUID) -> Project:
        project = await self.get_project(project_id)
        mark_archived(project)  # keeps the row; not a delete
        await self.session.commit()
        return await self.get_project(project.id)

    async def duplicate_project(self, project_id: uuid.UUID) -> Project:
        """Copy an existing project as a fresh DRAFT.

        The copy never inherits Published status; it gets a new unique slug and
        its own metric rows, while reusing (not duplicating) the same skills.
        """
        source = await self.get_project(project_id)
        new_title = f"{source.title} (Copy)"
        new_slug = await resolve_slug(self.repo, None, new_title)

        copy = Project(
            title=new_title,
            slug=new_slug,
            short_description=source.short_description,
            description=source.description,
            problem=source.problem,
            solution=source.solution,
            architecture=source.architecture,
            engineering_decisions=source.engineering_decisions,
            challenges=source.challenges,
            lessons_learned=source.lessons_learned,
            category=source.category,
            status=ContentStatus.DRAFT,
            featured=False,
            display_order=source.display_order,
            github_url=source.github_url,
            live_url=source.live_url,
            hero_image_url=source.hero_image_url,
            architecture_diagram_url=source.architecture_diagram_url,
            seo_title=source.seo_title,
            seo_description=source.seo_description,
        )
        copy.skills = list(source.skills)
        copy.metrics = [
            ProjectMetric(
                name=m.name,
                value=m.value,
                unit=m.unit,
                description=m.description,
                display_order=m.display_order,
            )
            for m in source.metrics
        ]

        self.session.add(copy)
        try:
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise
        return await self.get_project(copy.id)

    async def set_featured(self, project_id: uuid.UUID, featured: bool = True) -> Project:
        project = await self.get_project(project_id)
        project.featured = featured
        await self.session.commit()
        return await self.get_project(project.id)

    async def unset_featured(self, project_id: uuid.UUID) -> Project:
        return await self.set_featured(project_id, featured=False)
