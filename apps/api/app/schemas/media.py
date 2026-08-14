"""Media schemas (used nested inside profile, project, blog responses)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import ORMModel
from app.schemas.project import ProjectRef


class MediaResponse(ORMModel):
    id: uuid.UUID
    filename: str
    original_filename: str
    mime_type: str
    size: int
    url: str
    alt_text: str | None = None
    title: str | None = None
    description: str | None = None
    created_at: datetime


class MediaUpdate(BaseModel):
    alt_text: str | None = Field(default=None)
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None


class MediaUsageItem(BaseModel):
    kind: str  # "profile" | "blog"
    label: str
    slug: str | None = None


class MediaUsage(BaseModel):
    count: int
    items: list[MediaUsageItem] = []
    projects: list[ProjectRef] = []  # reserved; project media is URL-based today
