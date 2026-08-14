"""Site-settings schemas."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import ORMModel


class SiteSettingResponse(ORMModel):
    key: str
    value: str | None = None
    updated_at: datetime


class SiteSettingUpdate(BaseModel):
    value: str | None = None
