"""Profile schemas."""

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedResponse
from app.schemas.media import MediaResponse


class ProfileBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    headline: str = Field(min_length=1, max_length=255)
    short_bio: str
    long_bio: str
    location: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=512)
    github_url: str | None = Field(default=None, max_length=512)


class ProfileCreate(ProfileBase):
    profile_image_id: uuid.UUID | None = None
    resume_id: uuid.UUID | None = None


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    headline: str | None = Field(default=None, min_length=1, max_length=255)
    short_bio: str | None = None
    long_bio: str | None = None
    location: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=512)
    github_url: str | None = Field(default=None, max_length=512)
    profile_image_id: uuid.UUID | None = None
    resume_id: uuid.UUID | None = None


class ProfileResponse(TimestampedResponse):
    id: uuid.UUID
    name: str
    headline: str
    short_bio: str
    long_bio: str
    location: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    profile_image: MediaResponse | None = None
