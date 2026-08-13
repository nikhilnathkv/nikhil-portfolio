"""Shared Pydantic base classes for API schemas.

API schemas are deliberately separate from ORM models so the database structure
never leaks directly into the API surface.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Response base: populate from ORM attributes."""

    model_config = ConfigDict(from_attributes=True)


class TimestampedResponse(ORMModel):
    created_at: datetime
    updated_at: datetime
