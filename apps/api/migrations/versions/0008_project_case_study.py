"""project case-study fields

Adds evaluation + results narrative sections and an is_confidential flag to
projects (M4.3 case studies).

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-15 10:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("evaluation", sa.Text(), nullable=True))
    op.add_column("projects", sa.Column("results", sa.Text(), nullable=True))
    op.add_column(
        "projects",
        sa.Column(
            "is_confidential",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    # Drop the server default now that existing rows are backfilled; the app
    # supplies the value on insert.
    op.alter_column("projects", "is_confidential", server_default=None)


def downgrade() -> None:
    op.drop_column("projects", "is_confidential")
    op.drop_column("projects", "results")
    op.drop_column("projects", "evaluation")
