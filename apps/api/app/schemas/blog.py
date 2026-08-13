"""Blog post and tag schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ContentStatus
from app.schemas.base import TimestampedResponse
from app.schemas.media import MediaResponse


class BlogTagResponse(BaseModel):
    id: uuid.UUID
    name: str
    model_config = {"from_attributes": True}


class BlogPostBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    excerpt: str | None = Field(default=None, max_length=500)
    content: str = Field(min_length=1)
    category: str | None = Field(default=None, max_length=100)
    featured: bool = False
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)


class BlogPostCreate(BlogPostBase):
    slug: str | None = Field(default=None, max_length=255)
    status: ContentStatus = ContentStatus.DRAFT
    cover_image_id: uuid.UUID | None = None
    tags: list[str] = []


class BlogPostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    excerpt: str | None = Field(default=None, max_length=500)
    content: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, max_length=100)
    status: ContentStatus | None = None
    featured: bool | None = None
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)
    cover_image_id: uuid.UUID | None = None
    tags: list[str] | None = None


class BlogPostResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None = None
    content: str
    category: str | None = None
    status: ContentStatus
    featured: bool
    seo_title: str | None = None
    seo_description: str | None = None
    published_at: datetime | None = None
    cover_image: MediaResponse | None = None
    tags: list[BlogTagResponse] = []


class BlogPostListResponse(TimestampedResponse):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None = None
    category: str | None = None
    status: ContentStatus
    featured: bool
    published_at: datetime | None = None
    tags: list[BlogTagResponse] = []
