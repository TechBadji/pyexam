"""Personal practice: revision sets built from a student's mistakes, and mock exams."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.answer import Answer
from app.models.exam import Exam, ExamStatus
from app.models.question import CodingLanguage, MCQOption, Question, QuestionType
from app.models.question_bank import BankQuestion
from app.models.submission import Submission, SubmissionStatus
from app.models.track import MOCK_FORMATS, ExamKind, ExamTrack
from app.models.user import User

REVIEW = "review"
MOCK = "mock"


def _language_for(track: ExamTrack) -> CodingLanguage:
    return CodingLanguage.c if track == ExamTrack.c else CodingLanguage.python


async def missed_bank_question_ids(student_id: uuid.UUID, db: AsyncSession) -> list[uuid.UUID]:
    """
    Bank questions this student has got wrong at least once, most recently
    missed first. Partial credit on a coding question still counts as missed.
    """
    result = await db.execute(
        select(Question.source_bank_id, func.max(Submission.submitted_at).label("last_seen"))
        .join(Answer, Answer.question_id == Question.id)
        .join(Submission, Submission.id == Answer.submission_id)
        .where(
            Submission.student_id == student_id,
            Submission.status == SubmissionStatus.corrected,
            Question.source_bank_id.is_not(None),
            (Answer.score.is_(None)) | (Answer.score < Question.points),
        )
        .group_by(Question.source_bank_id)
        .order_by(func.max(Submission.submitted_at).desc())
    )
    return [row[0] for row in result.all()]


async def _replace_previous(student_id: uuid.UUID, purpose: str, db: AsyncSession) -> None:
    """
    Retire earlier sets of the same kind so the student is never handed a stale
    one. Sets they already sat are kept — deleting them would erase their
    history — they are simply closed.
    """
    result = await db.execute(
        select(Exam).where(
            Exam.owner_id == student_id,
            Exam.purpose == purpose,
            Exam.status == ExamStatus.active,
        )
    )
    for exam in result.scalars().all():
        exam.status = ExamStatus.closed


async def _build(
    *,
    student: User,
    track: ExamTrack,
    bank_questions: list[BankQuestion],
    title: str,
    description: str,
    minutes: int,
    purpose: str,
    passing_threshold: float | None,
    db: AsyncSession,
) -> Exam:
    now = datetime.now(timezone.utc)
    exam = Exam(
        title=title,
        description=description,
        duration_minutes=minutes,
        start_time=now,
        end_time=now + timedelta(days=365),
        status=ExamStatus.active,
        exam_type=track,
        kind=ExamKind.exercise,
        owner_id=student.id,
        purpose=purpose,
        passing_threshold=passing_threshold,
        created_by=student.id,
    )
    db.add(exam)
    await db.flush()

    for order, bq in enumerate(bank_questions, start=1):
        q = Question(
            exam_id=exam.id,
            type=bq.type,
            language=_language_for(track),
            order_index=order,
            points=bq.points,
            statement=bq.statement,
            test_cases=bq.test_cases,
            source_bank_id=bq.id,
            source_version=bq.version,
        )
        db.add(q)
        await db.flush()
        if bq.type == QuestionType.mcq:
            for opt in bq.options:
                db.add(MCQOption(
                    question_id=q.id, label=opt.label, text=opt.text, is_correct=opt.is_correct
                ))
    return exam


async def build_review(student: User, track: ExamTrack, limit: int, db: AsyncSession) -> Exam | None:
    """A revision set drawn from the questions this student actually got wrong."""
    missed = await missed_bank_question_ids(student.id, db)
    if not missed:
        return None

    result = await db.execute(
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
        .where(BankQuestion.id.in_(missed[: limit * 2]), BankQuestion.exam_type == track)
    )
    by_id = {bq.id: bq for bq in result.scalars().all()}
    ordered = [by_id[qid] for qid in missed if qid in by_id][:limit]
    if not ordered:
        return None

    await _replace_previous(student.id, REVIEW, db)
    return await _build(
        student=student,
        track=track,
        bank_questions=ordered,
        title="Révision de mes erreurs",
        description=f"{len(ordered)} question(s) que vous avez déjà manquée(s).",
        minutes=max(10, len(ordered) * 2),
        purpose=REVIEW,
        passing_threshold=None,
        db=db,
    )


async def build_mock(student: User, track: ExamTrack, db: AsyncSession) -> Exam | None:
    """A mock sitting at the real certification's format."""
    fmt = MOCK_FORMATS[track]

    async def draw(q_type: QuestionType, count: int) -> list[BankQuestion]:
        if count == 0:
            return []
        result = await db.execute(
            select(BankQuestion)
            .options(selectinload(BankQuestion.options))
            .where(BankQuestion.exam_type == track, BankQuestion.type == q_type)
            .order_by(func.random())
            .limit(count)
        )
        return list(result.scalars().all())

    picked = await draw(QuestionType.mcq, fmt.n_mcq) + await draw(QuestionType.coding, fmt.n_coding)
    if not picked:
        return None

    await _replace_previous(student.id, MOCK, db)
    return await _build(
        student=student,
        track=track,
        bank_questions=picked,
        title="Examen blanc",
        description=(
            f"{len(picked)} questions en {fmt.minutes} minutes. "
            f"Seuil de réussite : {fmt.pass_pct:.0f} %."
        ),
        minutes=fmt.minutes,
        purpose=MOCK,
        passing_threshold=fmt.pass_pct,
        db=db,
    )
