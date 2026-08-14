"""Profile business logic. The profile is a singleton."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleViolationError, ResourceNotFoundError
from app.models.profile import Profile
from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileCreate, ProfileUpdate


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProfileRepository(session)

    async def get_profile(self) -> Profile:
        profile = await self.repo.get()
        if profile is None:
            raise ResourceNotFoundError("Profile has not been configured")
        return profile

    async def update_profile(self, data: ProfileUpdate) -> Profile:
        profile = await self.get_profile()
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)
        await self.session.commit()
        return await self.get_profile()

    async def initialize_profile(self, data: ProfileCreate) -> Profile:
        """Create the single profile row. Not exposed via the public API — used
        by setup/seed. The database also guards against a second row."""
        if await self.repo.get() is not None:
            raise BusinessRuleViolationError("A profile already exists")
        profile = Profile(**data.model_dump())
        self.session.add(profile)
        await self.session.commit()
        return await self.get_profile()
