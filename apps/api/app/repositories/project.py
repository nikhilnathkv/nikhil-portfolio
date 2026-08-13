"""Project data access."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.project import Project, project_skills
from app.models.skill import Skill
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project

    async def get_by_slug(self, slug: str, *, include_deleted: bool = False) -> Project | None:
        stmt = self._base_select(include_deleted).where(Project.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(Project.id).where(Project.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(Project.id != exclude_id)
        result = await self.session.execute(stmt)
        return result.first() is not None

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
            .order_by(Project.display_order, Project.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())
