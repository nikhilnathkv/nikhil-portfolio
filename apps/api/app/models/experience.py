"""Work experience entries."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPKMixin
from app.models.project import Project

# Many-to-many: experiences <-> projects ("what did you build at this company?").
experience_projects = Table(
    "experience_projects",
    Base.metadata,
    Column(
        "experience_id",
        ForeignKey("experiences.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "project_id",
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Experience(UUIDPKMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "experiences"

    company: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)

    projects: Mapped[list[Project]] = relationship(
        secondary=experience_projects,
        lazy="selectin",
        order_by="Project.display_order",
    )
