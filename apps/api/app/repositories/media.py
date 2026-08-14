"""Media metadata data access.

Only stores metadata rows. The actual file upload to object storage will live in
a MediaService in a later milestone.
"""

from __future__ import annotations

from app.models.media import Media
from app.repositories.base import BaseRepository


class MediaRepository(BaseRepository[Media]):
    model = Media

    async def list_recent(self) -> list[Media]:
        return await self.list(order_by=Media.created_at.desc())
