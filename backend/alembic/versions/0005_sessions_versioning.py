"""Add sessions, versioning, enrollments, question stats

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-24 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── Draw config on exams ────────────────────────────────────────────────────
    op.execute("ALTER TABLE exams ADD COLUMN IF NOT EXISTS draw_config JSONB")

    # ── Question versioning ─────────────────────────────────────────────────────
    op.execute("ALTER TABLE bank_questions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1")

    op.execute("""
        CREATE TABLE IF NOT EXISTS bank_question_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bank_question_id UUID NOT NULL REFERENCES bank_questions(id) ON DELETE CASCADE,
            version INTEGER NOT NULL,
            snapshot JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(bank_question_id, version)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_bqv_bank_question_id ON bank_question_versions(bank_question_id)"
    )

    # ── Source tracking on exam questions ───────────────────────────────────────
    op.execute(
        "ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_bank_id UUID REFERENCES bank_questions(id) ON DELETE SET NULL"
    )
    op.execute(
        "ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_version INTEGER"
    )

    # ── Enrollment / random draw ────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS exam_enrollments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            drawn_question_ids JSONB NOT NULL DEFAULT '[]',
            UNIQUE(exam_id, student_id)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_enrollments_exam_id ON exam_enrollments(exam_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_enrollments_student_id ON exam_enrollments(student_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS exam_enrollments CASCADE")
    op.execute("DROP TABLE IF EXISTS bank_question_versions CASCADE")
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS source_version")
    op.execute("ALTER TABLE questions DROP COLUMN IF EXISTS source_bank_id")
    op.execute("ALTER TABLE bank_questions DROP COLUMN IF EXISTS version")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS draw_config")
