"""Initial migration — create all tables

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Drop any partial state from previous failed migrations
    op.execute("DROP TABLE IF EXISTS audit_logs, answers, submissions, mcq_options, questions, exams, users CASCADE")
    op.execute("DROP TYPE IF EXISTS userrole, preferredlanguage, examstatus, questiontype, submissionstatus CASCADE")

    op.execute("""
        CREATE TYPE userrole AS ENUM ('student', 'admin');
        CREATE TYPE preferredlanguage AS ENUM ('fr', 'en');
        CREATE TYPE examstatus AS ENUM ('draft', 'active', 'closed', 'corrected');
        CREATE TYPE questiontype AS ENUM ('mcq', 'coding');
        CREATE TYPE submissionstatus AS ENUM ('in_progress', 'submitted', 'corrected');

        CREATE TABLE users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email       VARCHAR(255) NOT NULL,
            full_name   VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role        userrole NOT NULL,
            student_number VARCHAR(50),
            preferred_language preferredlanguage NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_users_email ON users (email);

        CREATE TABLE exams (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title            VARCHAR(255) NOT NULL,
            description      TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            start_time       TIMESTAMPTZ NOT NULL,
            end_time         TIMESTAMPTZ NOT NULL,
            status           examstatus NOT NULL,
            created_by       UUID NOT NULL REFERENCES users(id),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE questions (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            exam_id     UUID NOT NULL REFERENCES exams(id),
            type        questiontype NOT NULL,
            order_index INTEGER NOT NULL,
            points      FLOAT NOT NULL,
            statement   TEXT NOT NULL,
            test_cases  JSONB
        );
        CREATE INDEX ix_questions_exam_id ON questions (exam_id);

        CREATE TABLE mcq_options (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            question_id UUID NOT NULL REFERENCES questions(id),
            label       VARCHAR(1) NOT NULL,
            text        TEXT NOT NULL,
            is_correct  BOOLEAN NOT NULL
        );
        CREATE INDEX ix_mcq_options_question_id ON mcq_options (question_id);

        CREATE TABLE submissions (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id       UUID NOT NULL REFERENCES users(id),
            exam_id          UUID NOT NULL REFERENCES exams(id),
            started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            submitted_at     TIMESTAMPTZ,
            status           submissionstatus NOT NULL,
            total_score      FLOAT,
            submission_token VARCHAR(255) NOT NULL UNIQUE,
            tab_switch_count INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX ix_submissions_student_id ON submissions (student_id);
        CREATE INDEX ix_submissions_exam_id    ON submissions (exam_id);
        CREATE INDEX ix_submissions_token      ON submissions (submission_token);

        CREATE TABLE answers (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            submission_id     UUID NOT NULL REFERENCES submissions(id),
            question_id       UUID NOT NULL REFERENCES questions(id),
            selected_option_id UUID REFERENCES mcq_options(id),
            code_written      TEXT,
            score             FLOAT,
            feedback          TEXT,
            execution_output  TEXT
        );
        CREATE INDEX ix_answers_submission_id ON answers (submission_id);
        CREATE INDEX ix_answers_question_id   ON answers (question_id);

        CREATE TABLE audit_logs (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id),
            action     VARCHAR(50) NOT NULL,
            extra_data JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX ix_audit_logs_user_id    ON audit_logs (user_id);
        CREATE INDEX ix_audit_logs_action     ON audit_logs (action);
        CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_logs, answers, submissions, mcq_options, questions, exams, users CASCADE")
    op.execute("DROP TYPE IF EXISTS userrole, preferredlanguage, examstatus, questiontype, submissionstatus CASCADE")
