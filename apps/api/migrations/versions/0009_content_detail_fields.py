"""research + experiment detail fields

Adds structured case-study-style narrative fields to research and experiments
(M4.5 research/experiments/writing).

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-15 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_RESEARCH_COLS = (
    "research_question",
    "dataset",
    "experimental_setup",
    "analysis",
    "limitations",
    "references",
)
_EXPERIMENT_COLS = ("setup", "approach", "learnings")


def upgrade() -> None:
    for col in _RESEARCH_COLS:
        op.add_column("research", sa.Column(col, sa.Text(), nullable=True))
    for col in _EXPERIMENT_COLS:
        op.add_column("experiments", sa.Column(col, sa.Text(), nullable=True))


def downgrade() -> None:
    for col in reversed(_EXPERIMENT_COLS):
        op.drop_column("experiments", col)
    for col in reversed(_RESEARCH_COLS):
        op.drop_column("research", col)
