"""Profile data access.

The profile is a singleton: at most one row is expected, enforced at the
database level (see the ``is_singleton`` unique constraint on the model). The
repository exposes ``get`` / ``update`` rather than a full CRUD surface.
"""

from __future__ import annotations

from sqlalchemy import select

from app.models.profile import Profile
from app.repositories.base import BaseRepository


class ProfileRepository(BaseRepository[Profile]):
    model = Profile

    async def get(self) -> Profile | None:
        result = await self.session.execute(select(Profile).order_by(Profile.created_at).limit(1))
        return result.scalar_one_or_none()
