"""GitHub-repository *metadata* business logic.

No external GitHub API calls — that belongs in a future GitHubIntegrationService.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.repository import Repository
from app.repositories.repository import GitHubRepository
from app.schemas.repository import RepositoryCreate, RepositoryUpdate


class GitHubRepositoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = GitHubRepository(session)

    async def list_repositories(self, *, featured: bool | None = None) -> list[Repository]:
        return await self.repo.list_ordered(featured=featured)

    async def get_repository(self, repository_id: uuid.UUID) -> Repository:
        item = await self.repo.get_by_id(repository_id)
        if item is None:
            raise ResourceNotFoundError("Repository not found")
        return item

    async def create_repository(self, data: RepositoryCreate) -> Repository:
        item = Repository(**data.model_dump())
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update_repository(
        self, repository_id: uuid.UUID, data: RepositoryUpdate
    ) -> Repository:
        item = await self.get_repository(repository_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete_repository(self, repository_id: uuid.UUID) -> None:
        item = await self.get_repository(repository_id)
        await self.repo.delete(item)
        await self.session.commit()
