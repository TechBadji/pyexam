"""Add promotional banners shown to students

Revision ID: 0013
Revises: 0012
Create Date: 2026-09-11 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS banners (
            id            UUID PRIMARY KEY,
            text          VARCHAR(200) NOT NULL,
            link_url      TEXT,
            image_url     TEXT,
            module        examtrack,
            is_active     BOOLEAN NOT NULL DEFAULT TRUE,
            order_index   INTEGER NOT NULL DEFAULT 0,
            starts_at     TIMESTAMPTZ,
            ends_at       TIMESTAMPTZ,
            created_by    UUID NOT NULL REFERENCES users(id),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_banners_active ON banners (is_active, order_index)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_banners_active")
    op.execute("DROP TABLE IF EXISTS banners")
