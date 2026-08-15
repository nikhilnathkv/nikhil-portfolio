"""profile education + certifications

Adds Markdown education + certifications fields to the profile (M4.6 resume).

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-15 14:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("education", sa.Text(), nullable=True))
    op.add_column("profiles", sa.Column("certifications", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "certifications")
    op.drop_column("profiles", "education")
