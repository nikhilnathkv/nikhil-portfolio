"""Services for profile, experience, skills, repositories, resume."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.experience import Experience
from app.models.profile import Profile
from app.models.repository import Repository as RepositoryModel
from app.models.resume import Resume
from app.models.skill import SkillCategory
from app.repositories.misc import (
    ExperienceRepository,
    ProfileRepository,
    RepositoryRepository,
    ResumeRepository,
    SkillCategoryRepository,
)


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ProfileRepository(session)

    async def get(self) -> Profile:
        profile = await self.repo.get_singleton()
        if profile is None:
            raise NotFoundError("Profile has not been configured")
        return profile


class ExperienceService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ExperienceRepository(session)

    async def list(self) -> list[Experience]:
        return await self.repo.list(
            order_by=(Experience.display_order, Experience.start_date.desc())
        )

    async def get(self, experience_id: uuid.UUID) -> Experience:
        item = await self.repo.get_by_id(experience_id)
        if item is None:
            raise NotFoundError("Experience not found")
        return item


class SkillService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = SkillCategoryRepository(session)

    async def list_categories(self) -> list[SkillCategory]:
        # Skills are eager-loaded via the relationship (lazy="selectin").
        return await self.repo.list(order_by=SkillCategory.display_order)


class RepositoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = RepositoryRepository(session)

    async def list(self, *, featured: bool | None = None) -> list[RepositoryModel]:
        filters = [RepositoryModel.featured.is_(featured)] if featured is not None else []
        return await self.repo.list(
            filters=filters,
            order_by=(RepositoryModel.display_order, RepositoryModel.name),
        )


class ResumeService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ResumeRepository(session)

    async def get_active(self) -> Resume:
        resume = await self.repo.get_active()
        if resume is None:
            raise NotFoundError("No active resume")
        return resume
