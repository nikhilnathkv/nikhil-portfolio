"""Experiment data access."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, or_, select

from app.models.enums import ContentStatus
from app.models.experiment import Experiment
from app.repositories.base import SlugRepository
from app.repositories.pagination import Page, PageRequest

DEFAULT_EXPERIMENT_ORDER = (Experiment.created_at.desc(),)


@dataclass
class ExperimentFilters:
    status: ContentStatus | None = None
    project_id: uuid.UUID | None = None
    search: str | None = None


class ExperimentRepository(SlugRepository[Experiment]):
    model = Experiment

    async def list_by_project(self, project_id: uuid.UUID) -> list[Experiment]:
        """All experiments associated with a given project."""
        return await self.list(
            filters=[Experiment.project_id == project_id],
            order_by=DEFAULT_EXPERIMENT_ORDER,
        )

    def _apply_filters(self, stmt: Any, filters: ExperimentFilters) -> Any:
        if filters.status is not None:
            stmt = stmt.where(Experiment.status == filters.status)
        if filters.project_id is not None:
            stmt = stmt.where(Experiment.project_id == filters.project_id)
        if filters.search:
            like = f"%{filters.search}%"
            stmt = stmt.where(or_(Experiment.title.ilike(like), Experiment.hypothesis.ilike(like)))
        return stmt

    async def search(
        self,
        *,
        filters: ExperimentFilters | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[Experiment]:
        filters = filters or ExperimentFilters()
        pagination = pagination or PageRequest()
        base = self._apply_filters(self._base_select(), filters)

        count_stmt = select(func.count()).select_from(
            base.order_by(None).with_only_columns(Experiment.id).subquery()
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = (
            base.order_by(*DEFAULT_EXPERIMENT_ORDER)
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = list((await self.session.execute(stmt)).scalars().unique().all())
        return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)
