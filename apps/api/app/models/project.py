"""Projects, their metrics, and the project↔skill association."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ContentStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPKMixin
from app.models.skill import Skill

# Many-to-many: projects <-> skills.
project_skills = Table(
    "project_skills",
    Base.metadata,
    Column(
        "project_id",
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Project(UUIDPKMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "projects"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Long-form narrative sections (Markdown).
    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture: Mapped[str | None] = mapped_column(Text, nullable=True)
    engineering_decisions: Mapped[str | None] = mapped_column(Text, nullable=True)
    challenges: Mapped[str | None] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Visual assets (URLs for now; a media library arrives in a later milestone).
    hero_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    architecture_diagram_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, native_enum=False, length=20),
        default=ContentStatus.DRAFT,
        nullable=False,
        index=True,
    )
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    github_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    live_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    metrics: Mapped[list[ProjectMetric]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectMetric.display_order",
        lazy="selectin",
    )
    skills: Mapped[list[Skill]] = relationship(
        secondary=project_skills,
        lazy="selectin",
    )


class ProjectMetric(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "project_metrics"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped[Project] = relationship(back_populates="metrics")
