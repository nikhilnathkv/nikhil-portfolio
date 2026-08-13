"""Research data access."""

from __future__ import annotations

from app.models.enums import ContentStatus
from app.models.research import Research
from app.repositories.base import SlugRepository

DEFAULT_RESEARCH_ORDER = (Research.published_at.desc(), Research.created_at.desc())


class ResearchRepository(SlugRepository[Research]):
    model = Research

    async def get_published(self) -> list[Research]:
        return await self.list(
            filters=[Research.status == ContentStatus.PUBLISHED],
            order_by=DEFAULT_RESEARCH_ORDER,
        )
