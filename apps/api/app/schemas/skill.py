"""Skill and skill-category schemas."""

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import ORMModel


class SkillCreate(BaseModel):
    category_id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    display_order: int = 0
    featured: bool = False


class SkillUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    display_order: int | None = None
    featured: bool | None = None


class SkillResponse(ORMModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    description: str | None = None
    display_order: int
    featured: bool


class SkillCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    display_order: int = 0


class SkillCategoryResponse(ORMModel):
    id: uuid.UUID
    name: str
    display_order: int
    skills: list[SkillResponse] = []
