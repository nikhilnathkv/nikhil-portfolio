"""Site-settings (key/value) data access."""

from __future__ import annotations

from sqlalchemy import select

from app.models.site_settings import SiteSetting
from app.repositories.base import BaseRepository


class SiteSettingRepository(BaseRepository[SiteSetting]):
    model = SiteSetting

    async def get_by_key(self, key: str) -> SiteSetting | None:
        result = await self.session.execute(select(SiteSetting).where(SiteSetting.key == key))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[SiteSetting]:
        return await self.list(order_by=SiteSetting.key.asc())
