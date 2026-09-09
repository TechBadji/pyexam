"""Add exam_type (certification track) on exams and bank_questions

Revision ID: 0011
Revises: 0010
Create Date: 2026-09-09 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE examtrack AS ENUM ('python', 'c', 'algo', 'psm1'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_type examtrack NOT NULL DEFAULT 'python'"
    )
    op.execute(
        "ALTER TABLE bank_questions ADD COLUMN IF NOT EXISTS exam_type examtrack NOT NULL DEFAULT 'python'"
    )
    op.execute(
        "UPDATE bank_questions SET exam_type = 'psm1' "
        "WHERE tags @> '[\"psm1\"]'::jsonb OR tags @> '[\"scrum\"]'::jsonb"
    )
    op.execute(
        "UPDATE bank_questions SET exam_type = 'c' "
        "WHERE exam_type = 'python' AND tags @> '[\"c\"]'::jsonb"
    )
    op.execute(
        "UPDATE bank_questions SET exam_type = 'algo' "
        "WHERE exam_type = 'python' AND tags @> '[\"algo-pack-v1\"]'::jsonb"
    )
    # Existing exams predate the column: infer C from the language already set on
    # their questions so they keep drawing from the right bank.
    op.execute(
        "UPDATE exams SET exam_type = 'c' WHERE id IN ("
        "SELECT DISTINCT exam_id FROM questions WHERE language = 'c')"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_bank_questions_exam_type ON bank_questions (exam_type)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_bank_questions_exam_type")
    op.execute("ALTER TABLE bank_questions DROP COLUMN IF EXISTS exam_type")
    op.execute("ALTER TABLE exams DROP COLUMN IF EXISTS exam_type")
    op.execute("DROP TYPE IF EXISTS examtrack")
