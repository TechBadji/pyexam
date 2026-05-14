"""Add language column on questions (python/c, default python)

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-14 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE TYPE codinglanguage AS ENUM ('python', 'c')")
    op.execute(
        "ALTER TABLE questions ADD COLUMN IF NOT EXISTS language codinglanguage NOT NULL DEFAULT 'python'"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS language")
    op.execute("DROP TYPE IF EXISTS codinglanguage")
