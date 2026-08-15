"""Research schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse
from app.schemas.common import HttpUrlStr, Slug
from app.schemas.project import ContentRef, ProjectRef


class ResearchBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    abstract: str | None = None
    research_question: str | None = None
    methodology: str | None = None
    dataset: str | None = None
    experimental_setup: str | None = None
    results: str | None = None
    analysis: str | None = None
    limitations: str | None = None
    conclusion: str | None = None
    references: str | None = None
    paper_url: HttpUrlStr | None = Field(default=None, max_length=512)
    publication_url: HttpUrlStr | None = Field(default=None, max_length=512)
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)
    project_id: uuid.UUID | None = None


class ResearchCreate(ResearchBase):
    slug: Slug | None = None
    status: ContentStatus = ContentStatus.DRAFT


class ResearchUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: Slug | None = None
    abstract: str | None = None
    research_question: str | None = None
    methodology: str | None = None
    dataset: str | None = None
    experimental_setup: str | None = None
    results: str | None = None
    analysis: str | None = None
    limitations: str | None = None
    conclusion: str | None = None
    references: str | None = None
    paper_url: HttpUrlStr | None = Field(default=None, max_length=512)
    publication_url: HttpUrlStr | None = Field(default=None, max_length=512)
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)
    project_id: uuid.UUID | None = None
    status: ContentStatus | None = None


class ResearchResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    abstract: str | None = None
    research_question: str | None = None
    methodology: str | None = None
    dataset: str | None = None
    experimental_setup: str | None = None
    results: str | None = None
    analysis: str | None = None
    limitations: str | None = None
    conclusion: str | None = None
    references: str | None = None
    paper_url: str | None = None
    publication_url: str | None = None
    github_url: str | None = None
    project_id: uuid.UUID | None = None
    project: ProjectRef | None = None
    status: ContentStatus
    published_at: datetime | None = None
    related_experiments: list[ContentRef] = []


class ResearchListResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    abstract: str | None = None
    project_id: uuid.UUID | None = None
    project: ProjectRef | None = None
    status: ContentStatus
    published_at: datetime | None = None
