"""Media schemas (used nested inside profile, project, blog responses)."""

import uuid

from app.schemas.base import ORMModel


class MediaResponse(ORMModel):
    id: uuid.UUID
    filename: str
    mime_type: str
    url: str
    alt_text: str | None = None
