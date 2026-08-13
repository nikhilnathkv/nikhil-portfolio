"""Research schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse


class ResearchBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    abstract: str | None = None
    methodology: str | None = None
    results: str | None = None
    conclusion: str | None = None
    paper_url: str | None = Field(default=None, max_length=512)
    publication_url: str | None = Field(default=None, max_length=512)
    github_url: str | None = Field(default=None, max_length=512)


class ResearchCreate(ResearchBase):
    slug: str | None = Field(default=None, max_length=255)
    status: ContentStatus = ContentStatus.DRAFT


class ResearchUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    abstract: str | None = None
    methodology: str | None = None
    results: str | None = None
    conclusion: str | None = None
    paper_url: str | None = Field(default=None, max_length=512)
    publication_url: str | None = Field(default=None, max_length=512)
    github_url: str | None = Field(default=None, max_length=512)
    status: ContentStatus | None = None


class ResearchResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    abstract: str | None = None
    methodology: str | None = None
    results: str | None = None
    conclusion: str | None = None
    paper_url: str | None = None
    publication_url: str | None = None
    github_url: str | None = None
    status: ContentStatus
    published_at: datetime | None = None


class ResearchListResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    abstract: str | None = None
    status: ContentStatus
    published_at: datetime | None = None
