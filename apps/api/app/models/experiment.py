"""Experiments, optionally linked to a project."""

from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ContentStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPKMixin
from app.models.project import Project


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
    project: Mapped[Project | None] = relationship(Project, lazy="selectin")
    github_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, native_enum=False, length=20),
        default=ContentStatus.DRAFT,
        nullable=False,
        index=True,
    )

    metrics: Mapped[list[ExperimentMetric]] = relationship(
        back_populates="experiment",
        cascade="all, delete-orphan",
        order_by="ExperimentMetric.display_order",
        lazy="selectin",
    )


class ExperimentMetric(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "experiment_metrics"

    experiment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    experiment: Mapped[Experiment] = relationship(back_populates="metrics")
