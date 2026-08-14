"""Experience business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleViolationError, ResourceNotFoundError
from app.models.experience import Experience
from app.repositories.experience import ExperienceRepository
from app.schemas.experience import ExperienceCreate, ExperienceUpdate


class ExperienceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ExperienceRepository(session)

    async def get_experience(self, experience_id: uuid.UUID) -> Experience:
        item = await self.repo.get_by_id(experience_id)
        if item is None:
            raise ResourceNotFoundError("Experience not found")
        return item

    async def list_experience(self) -> list[Experience]:
        return await self.repo.list_ordered()

    async def get_current_experience(self) -> list[Experience]:
        return await self.repo.get_current()

    async def create_experience(self, data: ExperienceCreate) -> Experience:
        values = self._normalize(data.model_dump())
        experience = Experience(**values)
        if experience.is_current:
            await self._demote_other_current(exclude_id=None)
        self.session.add(experience)
        await self.session.commit()
        return await self.get_experience(experience.id)

    async def update_experience(
        self, experience_id: uuid.UUID, data: ExperienceUpdate
    ) -> Experience:
        experience = await self.get_experience(experience_id)
        values = data.model_dump(exclude_unset=True)

        # Validate the resulting state (merge current values with the update).
        merged = {
            "is_current": values.get("is_current", experience.is_current),
            "start_date": values.get("start_date", experience.start_date),
            "end_date": values.get("end_date", experience.end_date),
        }
        merged = self._normalize(merged)
        values["end_date"] = merged["end_date"]

        for key, value in values.items():
            setattr(experience, key, value)

        if experience.is_current:
            await self._demote_other_current(exclude_id=experience.id)

        await self.session.commit()
        return await self.get_experience(experience.id)

    async def delete_experience(self, experience_id: uuid.UUID) -> None:
        experience = await self.get_experience(experience_id)
        await self.repo.delete(experience)
        await self.session.commit()

    # --- rules --------------------------------------------------------------
    @staticmethod
    def _normalize(values: dict) -> dict:
        """A current role has no end date; otherwise end must not precede start."""
        if values.get("is_current"):
            values["end_date"] = None
        start = values.get("start_date")
        end = values.get("end_date")
        if start and end and end < start:
            raise BusinessRuleViolationError("end_date cannot be earlier than start_date")
        return values

    async def _demote_other_current(self, *, exclude_id: uuid.UUID | None) -> None:
        for other in await self.repo.get_current():
            if exclude_id is None or other.id != exclude_id:
                other.is_current = False
        await self.session.flush()
