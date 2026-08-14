"""Experiment business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.models.enums import ContentStatus
from app.models.experiment import Experiment
from app.repositories.experiment import ExperimentRepository
from app.repositories.project import ProjectRepository
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate
from app.services._helpers import resolve_slug


class ExperimentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ExperimentRepository(session)
        self.projects = ProjectRepository(session)

    # --- public reads -------------------------------------------------------
    async def list(self, *, published_only: bool = True) -> list[Experiment]:
        filters = [Experiment.status == ContentStatus.PUBLISHED] if published_only else []
        return await self.repo.list(filters=filters, order_by=(Experiment.created_at.desc(),))

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

    async def list_experiments(self) -> list[Experiment]:
        return await self.repo.list(order_by=(Experiment.created_at.desc(),))

    async def create_experiment(self, data: ExperimentCreate) -> Experiment:
        await self._validate_project(data.project_id)
        slug = await resolve_slug(self.repo, data.slug, data.title)
        item = Experiment(**data.model_dump(exclude={"slug"}), slug=slug)
        self.session.add(item)
        await self.session.commit()
        return await self.get_experiment(item.id)

    async def update_experiment(
        self, experiment_id: uuid.UUID, data: ExperimentUpdate
    ) -> Experiment:
        item = await self.get_experiment(experiment_id)
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
        return await self.get_experiment(item.id)

    async def delete_experiment(self, experiment_id: uuid.UUID) -> None:
        item = await self.get_experiment(experiment_id)
        await self.repo.delete(item)
        await self.session.commit()

    async def _validate_project(self, project_id: uuid.UUID | None) -> None:
        # Give a useful application error rather than relying only on the FK.
        if project_id is not None and await self.projects.get_by_id(project_id) is None:
            raise ResourceNotFoundError(f"Project {project_id} does not exist")
