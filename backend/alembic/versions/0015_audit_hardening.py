"""Audit hardening: one live paper per candidate

Revision ID: 0015
Revises: 0014
Create Date: 2026-09-12 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Defensive: if a race before this fix ever left two "in_progress" rows
    # for the same (student, exam) — the very bug this migration closes off —
    # close every one but the most recent so the unique index below can be
    # created. Nothing is deleted; the older row is just marked submitted.
    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   row_number() OVER (
                       PARTITION BY student_id, exam_id
                       ORDER BY started_at DESC
                   ) AS rn
            FROM submissions
            WHERE status = 'in_progress'
        )
        UPDATE submissions
        SET status = 'submitted', submitted_at = now()
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        """
    )

    # A student can only ever have one live paper on a given exam. Enforced in
    # the database, not just in application code, so two concurrent requests
    # (two tabs, a flaky retry) can never both win.
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_submissions_one_live_per_exam
        ON submissions (student_id, exam_id)
        WHERE status = 'in_progress'
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_submissions_one_live_per_exam")
