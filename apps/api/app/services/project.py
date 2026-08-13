"""Project business logic.

Owns everything that is a *rule* rather than raw data access: slug generation
and uniqueness, publishing and publication dates, archiving, featured/ordering,
and wiring up relationships (skills, metrics).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import ContentStatus
from app.models.project import Project, ProjectMetric
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.slug import slugify


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProjectRepository(session)

    # --- reads --------------------------------------------------------------
    async def list(
        self,
        *,
        published_only: bool = True,
        featured: bool | None = None,
        category: str | None = None,
        skill: str | None = None,
    ) -> list[Project]:
        if skill:
            projects = await self.repo.list_by_skill_slug(skill)
            if published_only:
                projects = [p for p in projects if p.status == ContentStatus.PUBLISHED]
            return self._apply_flags(projects, featured=featured, category=category)

        filters = []
        if published_only:
            filters.append(Project.status == ContentStatus.PUBLISHED)
        if featured is not None:
            filters.append(Project.featured.is_(featured))
        if category:
            filters.append(Project.category == category)
        return await self.repo.list(
            filters=filters,
            order_by=(Project.display_order, Project.published_at.desc()),
        )

    @staticmethod
    def _apply_flags(
        projects: list[Project], *, featured: bool | None, category: str | None
    ) -> list[Project]:
        if featured is not None:
            projects = [p for p in projects if p.featured is featured]
        if category:
            projects = [p for p in projects if p.category == category]
        return projects

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Project:
        project = await self.repo.get_by_slug(slug)
        if project is None or (published_only and project.status != ContentStatus.PUBLISHED):
            raise NotFoundError(f"Project '{slug}' not found")
        return project

    async def get(self, project_id: uuid.UUID) -> Project:
        project = await self.repo.get_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        return project

    # --- writes -------------------------------------------------------------
    async def create(self, data: ProjectCreate) -> Project:
        slug = await self._resolve_slug(data.slug, data.title)

        project = Project(
            **data.model_dump(exclude={"slug", "skill_ids", "metrics", "status"}),
            slug=slug,
            status=data.status,
        )
        if data.status == ContentStatus.PUBLISHED:
            project.published_at = datetime.now(UTC)

        # Assign relationships on the still-transient instance *before* flushing.
        # Mutating a loaded/persistent relationship collection would trigger a
        # synchronous lazy-load and fail under async SQLAlchemy.
        project.skills = await self.repo.get_skills(data.skill_ids)
        project.metrics = [ProjectMetric(**m.model_dump()) for m in data.metrics]

        self.session.add(project)
        await self.session.flush()
        await self.session.commit()
        return await self.get(project.id)

    async def update(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project:
        project = await self.get(project_id)
        values = data.model_dump(exclude_unset=True, exclude={"skill_ids"})

        if "slug" in values and values["slug"]:
            if await self.repo.exists_by_slug(values["slug"], exclude_id=project.id):
                raise ConflictError(f"Slug '{values['slug']}' is already in use")

        # Manage publication date on status transitions.
        new_status = values.get("status")
        if new_status == ContentStatus.PUBLISHED and project.published_at is None:
            project.published_at = datetime.now(UTC)

        for key, value in values.items():
            setattr(project, key, value)

        if data.skill_ids is not None:
            project.skills = await self.repo.get_skills(data.skill_ids)

        await self.session.commit()
        return await self.get(project.id)

    async def delete(self, project_id: uuid.UUID) -> None:
        project = await self.get(project_id)
        await self.repo.delete(project)
        await self.session.commit()

    async def publish(self, project_id: uuid.UUID) -> Project:
        project = await self.get(project_id)
        project.status = ContentStatus.PUBLISHED
        if project.published_at is None:
            project.published_at = datetime.now(UTC)
        await self.session.commit()
        return await self.get(project.id)

    async def archive(self, project_id: uuid.UUID) -> Project:
        project = await self.get(project_id)
        project.status = ContentStatus.ARCHIVED
        await self.session.commit()
        return await self.get(project.id)

    # --- helpers ------------------------------------------------------------
    async def _resolve_slug(self, requested: str | None, title: str) -> str:
        base = slugify(requested) if requested else slugify(title)
        if not base:
            raise ConflictError("Could not derive a slug from the title")
        if requested and await self.repo.exists_by_slug(base):
            raise ConflictError(f"Slug '{base}' is already in use")
        # Auto-generated slugs get a numeric suffix to stay unique.
        candidate = base
        suffix = 2
        while await self.repo.exists_by_slug(candidate):
            candidate = f"{base}-{suffix}"
            suffix += 1
        return candidate
