"""m3.4 content: research->project link + experiment metrics

Adds the research↔project relationship and a metrics table for experiments
(so experiments can present measurable comparisons).

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-14 17:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("research", sa.Column("project_id", sa.Uuid(), nullable=True))
    op.create_index(op.f("ix_research_project_id"), "research", ["project_id"], unique=False)
    op.create_foreign_key(
        "fk_research_project_id",
        "research",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "experiment_metrics",
        sa.Column("experiment_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["experiment_id"], ["experiments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_experiment_metrics_experiment_id"),
        "experiment_metrics",
        ["experiment_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_experiment_metrics_experiment_id"), table_name="experiment_metrics")
    op.drop_table("experiment_metrics")
    op.drop_constraint("fk_research_project_id", "research", type_="foreignkey")
    op.drop_index(op.f("ix_research_project_id"), table_name="research")
    op.drop_column("research", "project_id")
