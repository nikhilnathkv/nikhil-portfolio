"""media metadata: title + description

Adds optional title/description to media records (M3.5 media library).

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-14 18:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("media", sa.Column("title", sa.String(length=255), nullable=True))
    op.add_column("media", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("media", "description")
    op.drop_column("media", "title")
