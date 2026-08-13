"""Repository schemas."""

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedResponse
from app.schemas.common import HttpUrlStr


class RepositoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    url: HttpUrlStr = Field(max_length=512)
    language: str | None = Field(default=None, max_length=100)
    featured: bool = False
    display_order: int = 0
    project_id: uuid.UUID | None = None


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    url: HttpUrlStr | None = Field(default=None, max_length=512)
    language: str | None = Field(default=None, max_length=100)
    featured: bool | None = None
    display_order: int | None = None
    project_id: uuid.UUID | None = None


class RepositoryResponse(TimestampedResponse):
    id: uuid.UUID
    name: str
    description: str | None = None
    url: str
    language: str | None = None
    featured: bool
    display_order: int
    project_id: uuid.UUID | None = None
