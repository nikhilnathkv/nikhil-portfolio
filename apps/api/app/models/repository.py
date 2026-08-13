"""GitHub repositories (initially managed manually; synced via API later)."""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Repository(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "repositories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
