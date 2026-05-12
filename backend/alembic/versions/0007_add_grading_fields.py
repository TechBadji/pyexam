"""Add grade_scale and passing_threshold on exams

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-12 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS grade_scale FLOAT")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_threshold FLOAT")


def downgrade() -> None:
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS grade_scale")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS passing_threshold")
