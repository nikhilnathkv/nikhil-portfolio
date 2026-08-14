"""Admin dashboard aggregation."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog import BlogPost
from app.models.enums import ContentStatus
from app.models.project import Project
from app.repositories.blog import BlogRepository
from app.repositories.contact import ContactMessageRepository
from app.repositories.experiment import ExperimentRepository
from app.repositories.project import ProjectRepository
from app.repositories.research import ResearchRepository


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.projects = ProjectRepository(session)
        self.blog = BlogRepository(session)
        self.research = ResearchRepository(session)
        self.experiments = ExperimentRepository(session)
        self.messages = ContactMessageRepository(session)

    async def summary(self) -> dict:
        return {
            "projects": await self._content_counts(self.projects, Project),
            "blog": await self._content_counts(self.blog, BlogPost),
            "research": await self.research.count(),
            "experiments": await self.experiments.count(),
            "unread_messages": await self.messages.get_unread_count(),
        }

    @staticmethod
    async def _content_counts(repo, model) -> dict:
        total = await repo.count()
        published = await repo.count(filters=[model.status == ContentStatus.PUBLISHED])
        drafts = await repo.count(filters=[model.status == ContentStatus.DRAFT])
        return {"total": total, "published": published, "drafts": drafts}
