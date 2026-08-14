"""Resume data access.

The persistence operations here support a "single active resume" rule, but the
rule itself (deactivate others when activating one) is enforced in the service
layer, which owns the transaction.
"""

from __future__ import annotations

from sqlalchemy import select, update

from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    model = Resume

    async def get_active(self) -> Resume | None:
        result = await self.session.execute(select(Resume).where(Resume.is_active.is_(True)))
        return result.scalar_one_or_none()

    async def list_ordered(self) -> list[Resume]:
        return await self.list(order_by=Resume.created_at.desc())

    async def deactivate_all(self) -> None:
        await self.session.execute(update(Resume).values(is_active=False))
        await self.session.flush()

    async def activate(self, resume: Resume) -> Resume:
        resume.is_active = True
        await self.session.flush()
        return resume

    async def archive(self, resume: Resume) -> Resume:
        resume.is_active = False
        await self.session.flush()
        return resume
