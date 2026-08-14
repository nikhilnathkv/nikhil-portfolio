"""project_cms_fields

Adds the fields the Project CMS (M3.2) needs: a ``challenges`` narrative section
(interview material) and two image URL columns (a media library arrives later).

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-14 15:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("challenges", sa.Text(), nullable=True))
    op.add_column("projects", sa.Column("hero_image_url", sa.String(length=512), nullable=True))
    op.add_column(
        "projects",
        sa.Column("architecture_diagram_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "architecture_diagram_url")
    op.drop_column("projects", "hero_image_url")
    op.drop_column("projects", "challenges")
