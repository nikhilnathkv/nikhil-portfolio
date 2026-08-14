"""Project data access."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select

from app.models.enums import ContentStatus
from app.models.project import Project, project_skills
from app.models.skill import Skill
from app.repositories.base import SlugRepository
from app.repositories.pagination import Page, PageRequest


@dataclass
class ProjectFilters:
    """Persistence-level filters. Carries no HTTP/request concepts."""

    status: ContentStatus | None = None
    category: str | None = None
    featured: bool | None = None
    skill: str | None = None  # skill name


# Default sort: manual ordering first, then most recent.
DEFAULT_PROJECT_ORDER = (Project.display_order.asc(), Project.created_at.desc())

# Whitelisted sort options — never accept arbitrary column names from clients.
PROJECT_SORTS = {
    "display_order": (Project.display_order.asc(), Project.created_at.desc()),
    "created_at": (Project.created_at.desc(),),
    "published_at": (Project.published_at.desc(), Project.created_at.desc()),
}


class ProjectRepository(SlugRepository[Project]):
    model = Project

    def _apply_filters(self, stmt: Any, filters: ProjectFilters) -> Any:
        if filters.status is not None:
            stmt = stmt.where(Project.status == filters.status)
        if filters.category is not None:
            stmt = stmt.where(Project.category == filters.category)
        if filters.featured is not None:
            stmt = stmt.where(Project.featured.is_(filters.featured))
        if filters.skill is not None:
            stmt = (
                stmt.join(project_skills, Project.id == project_skills.c.project_id)
                .join(Skill, Skill.id == project_skills.c.skill_id)
                .where(Skill.name.ilike(filters.skill))
            )
        return stmt

    async def search(
        self,
        *,
        filters: ProjectFilters | None = None,
        pagination: PageRequest | None = None,
        sort: str | None = None,
    ) -> Page[Project]:
        """Filtered, paginated, sorted project listing."""
        filters = filters or ProjectFilters()
        pagination = pagination or PageRequest()
        order_by = PROJECT_SORTS.get(sort or "", DEFAULT_PROJECT_ORDER)

        base = self._apply_filters(self._base_select(), filters)

        # Total distinct projects (the skill join can otherwise multiply rows).
        id_subquery = base.order_by(None).with_only_columns(Project.id).distinct().subquery()
        count_stmt = select(func.count()).select_from(id_subquery)
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = base.order_by(*order_by).offset(pagination.offset).limit(pagination.limit)
        items = list((await self.session.execute(stmt)).scalars().unique().all())
        return Page(items=items, total=total, page=pagination.page, page_size=pagination.page_size)

    async def get_featured(self, *, published_only: bool = True) -> list[Project]:
        stmt = self._base_select().where(Project.featured.is_(True))
        if published_only:
            stmt = stmt.where(Project.status == ContentStatus.PUBLISHED)
        stmt = stmt.order_by(*DEFAULT_PROJECT_ORDER)
        return list((await self.session.execute(stmt)).scalars().unique().all())

    async def get_skills(self, skill_ids: list[uuid.UUID]) -> list[Skill]:
        if not skill_ids:
            return []
        result = await self.session.execute(select(Skill).where(Skill.id.in_(skill_ids)))
        return list(result.scalars().all())

    async def list_by_skill_slug(self, skill_name: str) -> list[Project]:
        stmt = (
            self._base_select()
            .join(project_skills, Project.id == project_skills.c.project_id)
            .join(Skill, Skill.id == project_skills.c.skill_id)
            .where(Skill.name.ilike(skill_name))
            .order_by(*DEFAULT_PROJECT_ORDER)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())
