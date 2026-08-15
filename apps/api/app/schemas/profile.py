"""Profile schemas."""

import uuid

from pydantic import BaseModel, EmailStr, Field

from app.schemas.base import TimestampedResponse
from app.schemas.common import HttpUrlStr
from app.schemas.media import MediaResponse
from app.schemas.resume import ResumeResponse


class ProfileBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    headline: str = Field(min_length=1, max_length=255)
    short_bio: str
    long_bio: str
    location: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    linkedin_url: HttpUrlStr | None = Field(default=None, max_length=512)
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)
    education: str | None = None
    certifications: str | None = None


class ProfileCreate(ProfileBase):
    profile_image_id: uuid.UUID | None = None
    resume_id: uuid.UUID | None = None


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    headline: str | None = Field(default=None, min_length=1, max_length=255)
    short_bio: str | None = None
    long_bio: str | None = None
    location: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    linkedin_url: HttpUrlStr | None = Field(default=None, max_length=512)
    github_url: HttpUrlStr | None = Field(default=None, max_length=512)
    education: str | None = None
    certifications: str | None = None
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
    education: str | None = None
    certifications: str | None = None
    profile_image_id: uuid.UUID | None = None
    resume_id: uuid.UUID | None = None
    profile_image: MediaResponse | None = None
    resume: ResumeResponse | None = None
