"""Skill and skill-category data access."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.models.project import project_skills
from app.models.skill import Skill, SkillCategory
from app.repositories.base import BaseRepository


class SkillCategoryRepository(BaseRepository[SkillCategory]):
    model = SkillCategory

    async def list_ordered(self) -> list[SkillCategory]:
        return await self.list(order_by=SkillCategory.display_order.asc())

    async def get_by_name(self, name: str) -> SkillCategory | None:
        result = await self.session.execute(select(SkillCategory).where(SkillCategory.name == name))
        return result.scalar_one_or_none()


class SkillRepository(BaseRepository[Skill]):
    model = Skill

    async def list_by_category(self, category_id: uuid.UUID) -> list[Skill]:
        return await self.list(
            filters=[Skill.category_id == category_id],
            order_by=Skill.display_order.asc(),
        )

    async def name_exists_in_category(
        self, category_id: uuid.UUID, name: str, *, exclude_id: uuid.UUID | None = None
    ) -> bool:
        stmt = select(Skill.id).where(Skill.category_id == category_id, Skill.name == name)
        if exclude_id is not None:
            stmt = stmt.where(Skill.id != exclude_id)
        return (await self.session.execute(stmt)).first() is not None

    async def project_reference_count(self, skill_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(project_skills)
            .where(project_skills.c.skill_id == skill_id)
        )
        return int((await self.session.execute(stmt)).scalar_one())
