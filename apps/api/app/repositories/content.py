"""Slug-based repositories for the remaining content entities."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.core.database import Base
from app.models.experiment import Experiment
from app.models.research import Research
from app.repositories.base import BaseRepository


class _SlugRepository[ModelT: Base](BaseRepository[ModelT]):
    async def get_by_slug(self, slug: str, *, include_deleted: bool = False) -> ModelT | None:
        stmt = self._base_select(include_deleted).where(self.model.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(self.model.id).where(self.model.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(self.model.id != exclude_id)
        return (await self.session.execute(stmt)).first() is not None


class ResearchRepository(_SlugRepository[Research]):
    model = Research


class ExperimentRepository(_SlugRepository[Experiment]):
    model = Experiment
