"""Add exam kind (exam/exercise) and the certification module a student signed up for

Revision ID: 0012
Revises: 0011
Create Date: 2026-09-10 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE examkind AS ENUM ('exam', 'exercise'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "ALTER TABLE exams ADD COLUMN IF NOT EXISTS kind examkind NOT NULL DEFAULT 'exam'"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_exams_kind ON exams (kind)")

    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS module examtrack")
    # Every student enrolled so far is sitting the Scrum certification.
    op.execute("UPDATE users SET module = 'psm1' WHERE role = 'student' AND module IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_module ON users (module)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_module")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS module")
    op.execute("DROP INDEX IF EXISTS ix_exams_kind")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS kind")
    op.execute("DROP TYPE IF EXISTS examkind")
