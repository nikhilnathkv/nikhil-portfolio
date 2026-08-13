"""Resume schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import ORMModel


class ResumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    file_url: str = Field(min_length=1, max_length=1024)
    version: str = Field(min_length=1, max_length=50)
    is_active: bool = False


class ResumeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    file_url: str | None = Field(default=None, min_length=1, max_length=1024)
    version: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool | None = None


class ResumeResponse(ORMModel):
    id: uuid.UUID
    name: str
    file_url: str
    version: str
    is_active: bool
    created_at: datetime
