"""Research data access."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, or_, select

from app.models.enums import ContentStatus
from app.models.research import Research
from app.repositories.base import SlugRepository
from app.repositories.pagination import Page, PageRequest

DEFAULT_RESEARCH_ORDER = (Research.published_at.desc(), Research.created_at.desc())


@dataclass
class ResearchFilters:
    status: ContentStatus | None = None
    project_id: uuid.UUID | None = None
    search: str | None = None


class ResearchRepository(SlugRepository[Research]):
    model = Research

    async def get_published(self) -> list[Research]:
        return await self.list(
            filters=[Research.status == ContentStatus.PUBLISHED],
            order_by=DEFAULT_RESEARCH_ORDER,
        )

    def _apply_filters(self, stmt: Any, filters: ResearchFilters) -> Any:
        if filters.status is not None:
            stmt = stmt.where(Research.status == filters.status)
        if filters.project_id is not None:
            stmt = stmt.where(Research.project_id == filters.project_id)
        if filters.search:
            like = f"%{filters.search}%"
            stmt = stmt.where(or_(Research.title.ilike(like), Research.abstract.ilike(like)))
        return stmt

    async def search(
        self,
        *,
        filters: ResearchFilters | None = None,
        pagination: PageRequest | None = None,
    ) -> Page[Research]:
        filters = filters or ResearchFilters()
        pagination = pagination or PageRequest()
        base = self._apply_filters(self._base_select(), filters)

        count_stmt = select(func.count()).select_from(
            base.order_by(None).with_only_columns(Research.id).subquery()
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = (
            base.order_by(Research.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = list((await self.session.execute(stmt)).scalars().unique().all())
        return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)
