"""Experiments, optionally linked to a project."""

import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import ContentStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPKMixin


class Experiment(UUIDPKMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "experiments"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hypothesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    method: Mapped[str | None] = mapped_column(Text, nullable=True)
    results: Mapped[str | None] = mapped_column(Text, nullable=True)
    conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)

    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    github_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, native_enum=False, length=20),
        default=ContentStatus.DRAFT,
        nullable=False,
        index=True,
    )
