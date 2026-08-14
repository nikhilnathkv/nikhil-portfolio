"""Experiment schemas."""

import uuid

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse
from app.schemas.common import HttpUrlStr, Slug
from app.schemas.project import ProjectRef


class ExperimentMetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)
    unit: str | None = Field(default=None, max_length=50)
    description: str | None = None
    display_order: int = 0


class ExperimentMetricResponse(BaseModel):
    id: uuid.UUID
    name: str
    value: str
    unit: str | None = None
    description: str | None = None
    display_order: int

    model_config = {"from_attributes": True}


class ExperimentBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)


class ExperimentCreate(ExperimentBase):
    slug: Slug | None = None
    status: ContentStatus = ContentStatus.DRAFT
    metrics: list[ExperimentMetricCreate] = []


class ExperimentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: Slug | None = None
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)
    status: ContentStatus | None = None
    metrics: list[ExperimentMetricCreate] | None = None


class ExperimentResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    hypothesis: str | None = None
    method: str | None = None
    results: str | None = None
    conclusion: str | None = None
    project_id: uuid.UUID | None = None
    project: ProjectRef | None = None
    github_url: str | None = None
    status: ContentStatus
    metrics: list[ExperimentMetricResponse] = []


class ExperimentListResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    hypothesis: str | None = None
    project_id: uuid.UUID | None = None
    project: ProjectRef | None = None
    status: ContentStatus
