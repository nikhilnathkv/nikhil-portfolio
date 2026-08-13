"""Site owner profile. A single row is expected."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.media import Media
from app.models.mixins import TimestampMixin, UUIDPKMixin
from app.models.resume import Resume


class Profile(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "profiles"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str] = mapped_column(String(255), nullable=False)
    short_bio: Mapped[str] = mapped_column(Text, nullable=False)
    long_bio: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    profile_image_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )

    profile_image: Mapped[Media | None] = relationship(Media, lazy="selectin")
    resume: Mapped[Resume | None] = relationship(Resume, lazy="selectin")
