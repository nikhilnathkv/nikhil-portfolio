"""GitHub-repository metadata data access.

The class is named ``GitHubRepository`` to avoid the awkward
``RepositoryRepository``; the underlying ORM model is ``Repository``. GitHub API
synchronization will live in a GitHub *service*, not here.
"""

from __future__ import annotations

from app.models.repository import Repository
from app.repositories.base import BaseRepository

DEFAULT_REPOSITORY_ORDER = (Repository.display_order.asc(), Repository.name.asc())


class GitHubRepository(BaseRepository[Repository]):
    model = Repository

    async def list_ordered(self, *, featured: bool | None = None) -> list[Repository]:
        filters = [Repository.featured.is_(featured)] if featured is not None else []
        return await self.list(filters=filters, order_by=DEFAULT_REPOSITORY_ORDER)
