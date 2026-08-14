"""experience_projects

Adds the many-to-many association between experiences and projects, so a work
experience can showcase the projects built there (M3.3).

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-14 16:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "experience_projects",
        sa.Column("experience_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["experience_id"], ["experiences.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("experience_id", "project_id"),
    )


def downgrade() -> None:
    op.drop_table("experience_projects")
