"""Add class_name on users and allowed_groups on exams

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-11 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS class_name VARCHAR(100)")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS allowed_groups JSONB")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS class_name")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS allowed_groups")
