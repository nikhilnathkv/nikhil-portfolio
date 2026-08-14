"""Skill and skill-category business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BusinessRuleViolationError,
    DuplicateResourceError,
    ResourceNotFoundError,
)
from app.models.skill import Skill, SkillCategory
from app.repositories.skill import SkillCategoryRepository, SkillRepository
from app.schemas.skill import SkillCategoryCreate, SkillCreate, SkillUpdate


class SkillService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.categories = SkillCategoryRepository(session)
        self.skills = SkillRepository(session)

    # --- reads --------------------------------------------------------------
    async def list_categories(self) -> list[SkillCategory]:
        return await self.categories.list_ordered()

    async def list_skills(self) -> list[Skill]:
        return await self.skills.list(order_by=Skill.display_order.asc())

    async def list_by_category(self, category_id: uuid.UUID) -> list[Skill]:
        return await self.skills.list_by_category(category_id)

    # --- categories ---------------------------------------------------------
    async def create_category(self, data: SkillCategoryCreate) -> SkillCategory:
        if await self.categories.get_by_name(data.name):
            raise DuplicateResourceError(f"Category '{data.name}' already exists")
        category = SkillCategory(**data.model_dump())
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update_category(
        self, category_id: uuid.UUID, *, name: str | None = None, display_order: int | None = None
    ) -> SkillCategory:
        category = await self._get_category(category_id)
        if name is not None and name != category.name:
            if await self.categories.get_by_name(name):
                raise DuplicateResourceError(f"Category '{name}' already exists")
            category.name = name
        if display_order is not None:
            category.display_order = display_order
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete_category(self, category_id: uuid.UUID) -> None:
        category = await self._get_category(category_id)
        await self.categories.delete(category)  # cascades to its skills
        await self.session.commit()

    # --- skills -------------------------------------------------------------
    async def create_skill(self, data: SkillCreate) -> Skill:
        await self._ensure_category(data.category_id)
        if await self.skills.name_exists_in_category(data.category_id, data.name):
            raise DuplicateResourceError(f"Skill '{data.name}' already exists in this category")
        skill = Skill(**data.model_dump())
        self.session.add(skill)
        await self.session.commit()
        await self.session.refresh(skill)
        return skill

    async def update_skill(self, skill_id: uuid.UUID, data: SkillUpdate) -> Skill:
        skill = await self._get_skill(skill_id)
        values = data.model_dump(exclude_unset=True)
        category_id = values.get("category_id", skill.category_id)
        name = values.get("name", skill.name)
        if "name" in values or "category_id" in values:
            clash = await self.skills.name_exists_in_category(
                category_id, name, exclude_id=skill.id
            )
            if clash:
                raise DuplicateResourceError(f"Skill '{name}' already exists in this category")
        for key, value in values.items():
            setattr(skill, key, value)
        await self.session.commit()
        await self.session.refresh(skill)
        return skill

    async def delete_skill(self, skill_id: uuid.UUID, *, force: bool = False) -> None:
        skill = await self._get_skill(skill_id)
        references = await self.skills.project_reference_count(skill.id)
        if references and not force:
            raise BusinessRuleViolationError(
                f"Skill is referenced by {references} project(s); pass force to delete anyway"
            )
        await self.skills.delete(skill)
        await self.session.commit()

    # --- internals ----------------------------------------------------------
    async def _get_category(self, category_id: uuid.UUID) -> SkillCategory:
        category = await self.categories.get_by_id(category_id)
        if category is None:
            raise ResourceNotFoundError("Skill category not found")
        return category

    async def _ensure_category(self, category_id: uuid.UUID) -> None:
        await self._get_category(category_id)

    async def _get_skill(self, skill_id: uuid.UUID) -> Skill:
        skill = await self.skills.get_by_id(skill_id)
        if skill is None:
            raise ResourceNotFoundError("Skill not found")
        return skill
