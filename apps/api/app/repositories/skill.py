"""Skill and skill-category data access."""

from __future__ import annotations

import uuid

from app.models.skill import Skill, SkillCategory
from app.repositories.base import BaseRepository


class SkillCategoryRepository(BaseRepository[SkillCategory]):
    model = SkillCategory

    async def list_ordered(self) -> list[SkillCategory]:
        return await self.list(order_by=SkillCategory.display_order.asc())


class SkillRepository(BaseRepository[Skill]):
    model = Skill

    async def list_by_category(self, category_id: uuid.UUID) -> list[Skill]:
        return await self.list(
            filters=[Skill.category_id == category_id],
            order_by=Skill.display_order.asc(),
        )
