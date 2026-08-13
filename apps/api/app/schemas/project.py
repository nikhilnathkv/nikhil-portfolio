"""Project schemas — Create / Update / Response / ListResponse.

Demonstrates the separation between the database model and the API surface:
create/update accept a controlled subset of fields; responses expose a curated
shape (list responses omit heavy narrative fields).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse
from app.schemas.skill import SkillResponse


# --- Metrics ---------------------------------------------------------------
class ProjectMetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)
    unit: str | None = Field(default=None, max_length=50)
    description: str | None = None
    display_order: int = 0


class ProjectMetricResponse(BaseModel):
    id: uuid.UUID
    name: str
    value: str
    unit: str | None = None
    description: str | None = None
    display_order: int

    model_config = {"from_attributes": True}


# --- Project ---------------------------------------------------------------
class ProjectBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    short_description: str = Field(min_length=1, max_length=500)
    description: str | None = None
    problem: str | None = None
    solution: str | None = None
    architecture: str | None = None
    engineering_decisions: str | None = None
    lessons_learned: str | None = None
    category: str | None = Field(default=None, max_length=100)
    featured: bool = False
    display_order: int = 0
    github_url: str | None = Field(default=None, max_length=512)
    live_url: str | None = Field(default=None, max_length=512)
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)


class ProjectCreate(ProjectBase):
    # Optional; the service generates one from the title when omitted.
    slug: str | None = Field(default=None, max_length=255)
    status: ContentStatus = ContentStatus.DRAFT
    skill_ids: list[uuid.UUID] = []
    metrics: list[ProjectMetricCreate] = []


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    short_description: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    problem: str | None = None
    solution: str | None = None
    architecture: str | None = None
    engineering_decisions: str | None = None
    lessons_learned: str | None = None
    category: str | None = Field(default=None, max_length=100)
    status: ContentStatus | None = None
    featured: bool | None = None
    display_order: int | None = None
    github_url: str | None = Field(default=None, max_length=512)
    live_url: str | None = Field(default=None, max_length=512)
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)
    skill_ids: list[uuid.UUID] | None = None


class ProjectResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    short_description: str
    description: str | None = None
    problem: str | None = None
    solution: str | None = None
    architecture: str | None = None
    engineering_decisions: str | None = None
    lessons_learned: str | None = None
    category: str | None = None
    status: ContentStatus
    featured: bool
    display_order: int
    github_url: str | None = None
    live_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    published_at: datetime | None = None
    metrics: list[ProjectMetricResponse] = []
    skills: list[SkillResponse] = []


class ProjectListResponse(TimestampedResponse):
    """Lighter shape for list endpoints (omits long-form narrative sections)."""

    id: uuid.UUID
    title: str
    slug: str
    short_description: str
    category: str | None = None
    status: ContentStatus
    featured: bool
    display_order: int
    published_at: datetime | None = None
    skills: list[SkillResponse] = []
