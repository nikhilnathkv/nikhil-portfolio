"""Experiment business logic and lifecycle."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.models.enums import ContentStatus
from app.models.experiment import Experiment, ExperimentMetric
from app.repositories.experiment import ExperimentFilters, ExperimentRepository
from app.repositories.pagination import Page, PageRequest
from app.repositories.project import ProjectRepository
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate
from app.services._helpers import (
    mark_archived,
    mark_published,
    require_publishable,
    resolve_slug,
)

PUBLISH_REQUIRED_FIELDS = ["title", "slug"]


class ExperimentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ExperimentRepository(session)
        self.projects = ProjectRepository(session)

    # --- public reads -------------------------------------------------------
    async def list(
        self, *, published_only: bool = True, project_id: uuid.UUID | None = None
    ) -> list[Experiment]:
        filters = ExperimentFilters(
            status=ContentStatus.PUBLISHED if published_only else None, project_id=project_id
        )
        page = await self.repo.search(filters=filters, pagination=PageRequest(page_size=100))
        return page.items

    async def get_by_slug(self, slug: str, *, published_only: bool = True) -> Experiment:
        item = await self.repo.get_by_slug(slug)
        if item is None or (published_only and item.status != ContentStatus.PUBLISHED):
            raise ResourceNotFoundError(f"Experiment '{slug}' not found")
        return item

    # --- admin --------------------------------------------------------------
    async def get_experiment(self, experiment_id: uuid.UUID) -> Experiment:
        item = await self.repo.get_by_id(experiment_id)
        if item is None:
            raise ResourceNotFoundError("Experiment not found")
        return item

    async def search(
        self,
        *,
        filters: ExperimentFilters | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[Experiment]:
        return await self.repo.search(filters=filters, pagination=pagination)

    async def create_experiment(self, data: ExperimentCreate) -> Experiment:
        await self._validate_project(data.project_id)
        slug = await resolve_slug(self.repo, data.slug, data.title)
        item = Experiment(
            **data.model_dump(exclude={"slug", "status", "metrics"}),
            slug=slug,
            status=ContentStatus.DRAFT,
        )
        item.metrics = [ExperimentMetric(**m.model_dump()) for m in data.metrics]
        if data.status == ContentStatus.PUBLISHED:
            require_publishable(item, PUBLISH_REQUIRED_FIELDS)
            mark_published(item)
        self.session.add(item)
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def update_experiment(
        self, experiment_id: uuid.UUID, data: ExperimentUpdate
    ) -> Experiment:
        item = await self.get_experiment(experiment_id)
        values = data.model_dump(exclude_unset=True, exclude={"metrics"})
        if "project_id" in values:
            await self._validate_project(values["project_id"])
        if values.get("slug") and await self.repo.exists_by_slug(
            values["slug"], exclude_id=item.id
        ):
            raise DuplicateResourceError(f"Slug '{values['slug']}' is already in use")
        for key, value in values.items():
            setattr(item, key, value)
        if data.metrics is not None:
            item.metrics = [ExperimentMetric(**m.model_dump()) for m in data.metrics]
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def publish_experiment(self, experiment_id: uuid.UUID) -> Experiment:
        item = await self.get_experiment(experiment_id)
        require_publishable(item, PUBLISH_REQUIRED_FIELDS)
        mark_published(item)
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def unpublish_experiment(self, experiment_id: uuid.UUID) -> Experiment:
        item = await self.get_experiment(experiment_id)
        item.status = ContentStatus.DRAFT
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def archive_experiment(self, experiment_id: uuid.UUID) -> Experiment:
        item = await self.get_experiment(experiment_id)
        mark_archived(item)
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def duplicate_experiment(self, experiment_id: uuid.UUID) -> Experiment:
        source = await self.get_experiment(experiment_id)
        new_title = f"{source.title} (Copy)"
        new_slug = await resolve_slug(self.repo, None, new_title)
        copy = Experiment(
            title=new_title,
            slug=new_slug,
            hypothesis=source.hypothesis,
            method=source.method,
            results=source.results,
            conclusion=source.conclusion,
            project_id=source.project_id,
            github_url=source.github_url,
            status=ContentStatus.DRAFT,
        )
        copy.metrics = [
            ExperimentMetric(
                name=m.name,
                value=m.value,
                unit=m.unit,
                description=m.description,
                display_order=m.display_order,
            )
            for m in source.metrics
        ]
        self.session.add(copy)
        await self.session.commit()
        return await self.get_experiment(copy.id)

    async def delete_experiment(self, experiment_id: uuid.UUID) -> None:
        item = await self.get_experiment(experiment_id)
        await self.repo.delete(item)
        await self.session.commit()

    async def _validate_project(self, project_id: uuid.UUID | None) -> None:
        if project_id is not None and await self.projects.get_by_id(project_id) is None:
            raise ResourceNotFoundError(f"Project {project_id} does not exist")
