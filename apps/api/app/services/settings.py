"""Site-settings business logic (key/value)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.site_settings import SiteSetting
from app.repositories.site_settings import SiteSettingRepository


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SiteSettingRepository(session)

    async def list_settings(self) -> list[SiteSetting]:
        return await self.repo.list_all()

    async def get_setting(self, key: str) -> SiteSetting:
        setting = await self.repo.get_by_key(key)
        if setting is None:
            raise ResourceNotFoundError(f"Setting '{key}' not found")
        return setting

    async def upsert_setting(self, key: str, value: str | None) -> SiteSetting:
        setting = await self.repo.get_by_key(key)
        if setting is None:
            setting = SiteSetting(key=key, value=value)
            self.session.add(setting)
        else:
            setting.value = value
        await self.session.commit()
        await self.session.refresh(setting)
        return setting
