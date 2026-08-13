"""Repositories for entities without slugs / with small custom needs."""

from __future__ import annotations

from sqlalchemy import select, update

from app.models.experience import Experience
from app.models.profile import Profile
from app.models.repository import Repository as RepositoryModel
from app.models.resume import Resume
from app.models.skill import Skill, SkillCategory
from app.repositories.base import BaseRepository


class ExperienceRepository(BaseRepository[Experience]):
    model = Experience


class RepositoryRepository(BaseRepository[RepositoryModel]):
    model = RepositoryModel


class SkillCategoryRepository(BaseRepository[SkillCategory]):
    model = SkillCategory


class SkillRepository(BaseRepository[Skill]):
    model = Skill


class ProfileRepository(BaseRepository[Profile]):
    model = Profile

    async def get_singleton(self) -> Profile | None:
        result = await self.session.execute(select(Profile).order_by(Profile.created_at).limit(1))
        return result.scalar_one_or_none()


class ResumeRepository(BaseRepository[Resume]):
    model = Resume

    async def get_active(self) -> Resume | None:
        result = await self.session.execute(select(Resume).where(Resume.is_active.is_(True)))
        return result.scalar_one_or_none()

    async def deactivate_all(self) -> None:
        await self.session.execute(update(Resume).values(is_active=False))
        await self.session.flush()
