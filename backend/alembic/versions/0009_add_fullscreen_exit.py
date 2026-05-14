"""Add fullscreen_exit_count on submissions

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-14 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS fullscreen_exit_count INTEGER NOT NULL DEFAULT 0")


def downgrade() -> None:
    op.execute("ALTER TABLE submissions DROP COLUMN IF EXISTS fullscreen_exit_count")
