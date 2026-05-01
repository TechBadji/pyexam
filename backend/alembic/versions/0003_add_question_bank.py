"""Add question bank tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-24 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE difficultylevel AS ENUM ('beginner', 'intermediate', 'expert', 'culture')"
    )

    op.execute("""
        CREATE TABLE bank_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type questiontype NOT NULL,
            difficulty difficultylevel NOT NULL DEFAULT 'beginner',
            tags JSONB NOT NULL DEFAULT '[]',
            statement TEXT NOT NULL,
            points FLOAT NOT NULL DEFAULT 1.0,
            test_cases JSONB,
            created_by UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE bank_mcq_options (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            question_id UUID NOT NULL REFERENCES bank_questions(id) ON DELETE CASCADE,
            label VARCHAR(1) NOT NULL,
            text TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)

    op.execute("CREATE INDEX ix_bank_questions_type ON bank_questions(type)")
    op.execute("CREATE INDEX ix_bank_questions_difficulty ON bank_questions(difficulty)")
    op.execute("CREATE INDEX ix_bank_mcq_options_question_id ON bank_mcq_options(question_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS bank_mcq_options CASCADE")
    op.execute("DROP TABLE IF EXISTS bank_questions CASCADE")
    op.execute("DROP TYPE IF EXISTS difficultylevel CASCADE")
