"""Experience data access."""

from __future__ import annotations

from app.models.experience import Experience
from app.repositories.base import BaseRepository

DEFAULT_EXPERIENCE_ORDER = (Experience.display_order.asc(), Experience.start_date.desc())


class ExperienceRepository(BaseRepository[Experience]):
    model = Experience

    async def list_ordered(self) -> list[Experience]:
        return await self.list(order_by=DEFAULT_EXPERIENCE_ORDER)

    async def get_current(self) -> list[Experience]:
        """Roles currently held (there may legitimately be more than one)."""
        return await self.list(
            filters=[Experience.is_current.is_(True)],
            order_by=DEFAULT_EXPERIENCE_ORDER,
        )
