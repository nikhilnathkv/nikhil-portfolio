"""Resume versions. Only one row may be active at a time (partial unique index)."""

from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Resume(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "resumes"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        # Enforce at most one active resume.
        Index(
            "uq_resumes_single_active",
            "is_active",
            unique=True,
            postgresql_where="is_active",
        ),
    )
