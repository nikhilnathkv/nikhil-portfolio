"""Authentication schemas. Password hashes are never part of any response."""

import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.base import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserResponse(ORMModel):
    id: uuid.UUID
    email: str
    role: UserRole
    is_active: bool


class LoginResponse(BaseModel):
    user: UserResponse
