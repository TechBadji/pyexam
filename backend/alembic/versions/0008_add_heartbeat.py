"""Add last_heartbeat on submissions for grace period reconnect detection

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-14 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE submissions DROP COLUMN IF EXISTS last_heartbeat")
