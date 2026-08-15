"""Experience data access."""

from __future__ import annotations

import uuid

from app.models.experience import Experience, experience_projects
from app.repositories.base import BaseRepository

DEFAULT_EXPERIENCE_ORDER = (Experience.display_order.asc(), Experience.start_date.desc())


class ExperienceRepository(BaseRepository[Experience]):
    model = Experience

    async def list_ordered(self) -> list[Experience]:
        return await self.list(order_by=DEFAULT_EXPERIENCE_ORDER)

    async def list_by_project(self, project_id: uuid.UUID) -> list[Experience]:
        """Roles that link to the given project (for the case-study backlink)."""
        stmt = (
            self._base_select()
            .join(experience_projects, Experience.id == experience_projects.c.experience_id)
            .where(experience_projects.c.project_id == project_id)
            .order_by(*DEFAULT_EXPERIENCE_ORDER)
        )
        return list((await self.session.execute(stmt)).scalars().unique().all())

    async def get_current(self) -> list[Experience]:
        """Roles currently held (there may legitimately be more than one)."""
        return await self.list(
            filters=[Experience.is_current.is_(True)],
            order_by=DEFAULT_EXPERIENCE_ORDER,
        )
