"""Experiment schemas."""

import uuid

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse


class ExperimentBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    github_url: str | None = Field(default=None, max_length=512)


class ExperimentCreate(ExperimentBase):
    slug: str | None = Field(default=None, max_length=255)
    status: ContentStatus = ContentStatus.DRAFT


class ExperimentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    github_url: str | None = Field(default=None, max_length=512)
    status: ContentStatus | None = None


class ExperimentResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    github_url: str | None = None
    status: ContentStatus


class ExperimentListResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    hypothesis: str | None = None
    project_id: uuid.UUID | None = None
    status: ContentStatus
