"""Experiment data access."""

from __future__ import annotations

import uuid

from app.models.experiment import Experiment
from app.repositories.base import SlugRepository

DEFAULT_EXPERIMENT_ORDER = (Experiment.created_at.desc(),)


class ExperimentRepository(SlugRepository[Experiment]):
    model = Experiment

    async def list_by_project(self, project_id: uuid.UUID) -> list[Experiment]:
        """All experiments associated with a given project."""
        return await self.list(
            filters=[Experiment.project_id == project_id],
            order_by=DEFAULT_EXPERIMENT_ORDER,
        )
