"""Resume business logic — enforces a single active resume."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.resume import Resume
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate


class ResumeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ResumeRepository(session)

    async def get_active_resume(self) -> Resume:
        resume = await self.repo.get_active()
        if resume is None:
            raise ResourceNotFoundError("No active resume")
        return resume

    async def list_resumes(self) -> list[Resume]:
        return await self.repo.list_ordered()

    async def get_resume(self, resume_id: uuid.UUID) -> Resume:
        resume = await self.repo.get_by_id(resume_id)
        if resume is None:
            raise ResourceNotFoundError("Resume not found")
        return resume

    async def upload_resume(self, data: ResumeCreate) -> Resume:
        """Store resume metadata. If marked active, it becomes the only active one."""
        make_active = data.is_active
        resume = Resume(**data.model_dump(exclude={"is_active"}), is_active=False)
        self.session.add(resume)
        await self.session.flush()
        if make_active:
            await self._activate(resume)
        await self.session.commit()
        return await self.get_resume(resume.id)

    async def activate_resume(self, resume_id: uuid.UUID) -> Resume:
        resume = await self.get_resume(resume_id)
        await self._activate(resume)
        await self.session.commit()
        return await self.get_resume(resume.id)

    async def archive_resume(self, resume_id: uuid.UUID) -> Resume:
        resume = await self.get_resume(resume_id)
        await self.repo.archive(resume)
        await self.session.commit()
        return await self.get_resume(resume.id)

    async def _activate(self, resume: Resume) -> None:
        # Atomic within the caller's transaction: demote all, then promote one.
        await self.repo.deactivate_all()
        await self.repo.activate(resume)
