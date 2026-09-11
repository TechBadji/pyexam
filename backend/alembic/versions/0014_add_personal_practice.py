"""Add personal practice exams: revision sets and mock exams

Revision ID: 0014
Revises: 0013
Create Date: 2026-09-11 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id)")
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS purpose VARCHAR(20)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_exams_owner ON exams (owner_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_exams_owner")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS purpose")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS owner_id")
