"""Skill categories and skills."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class SkillCategory(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "skill_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)

    skills: Mapped[list[Skill]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Skill.display_order",
        lazy="selectin",
    )


class Skill(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "skills"

    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skill_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    category: Mapped[SkillCategory] = relationship(back_populates="skills", lazy="selectin")

    __table_args__ = (UniqueConstraint("category_id", "name", name="uq_skills_category_name"),)
