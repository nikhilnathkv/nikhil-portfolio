"""Resume business logic — enforces a single active resume."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BusinessRuleViolationError, ResourceNotFoundError
from app.models.resume import Resume
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate
from app.services.storage import StorageService, get_storage_service


class ResumeService:
    def __init__(self, session: AsyncSession, storage: StorageService | None = None) -> None:
        self.session = session
        self.repo = ResumeRepository(session)
        self.storage = storage or get_storage_service()

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

    async def upload_resume_file(
        self,
        *,
        data: bytes,
        original_filename: str,
        content_type: str,
        name: str,
        version: str,
        is_active: bool = False,
    ) -> Resume:
        """Store a PDF resume in object storage and record it."""
        if content_type != "application/pdf" and not original_filename.lower().endswith(".pdf"):
            raise BusinessRuleViolationError("Resume must be a PDF file.")
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise BusinessRuleViolationError(f"File exceeds the {settings.max_upload_mb} MB limit.")

        key = self.storage.build_key(original_filename)
        url = self.storage.upload(data, key, "application/pdf")

        resume = Resume(name=name, file_url=url, version=version, is_active=False)
        self.session.add(resume)
        await self.session.flush()
        if is_active:
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
