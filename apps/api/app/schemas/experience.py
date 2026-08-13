"""Experience schemas."""

import uuid
from datetime import date

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedResponse


class ExperienceBase(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    summary: str | None = None
    description: str | None = None
    display_order: int = 0


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, min_length=1, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    summary: str | None = None
    description: str | None = None
    display_order: int | None = None


class ExperienceResponse(TimestampedResponse):
    id: uuid.UUID
    company: str
    role: str
    location: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool
    summary: str | None = None
    description: str | None = None
    display_order: int
