import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.answer import Answer
from app.models.question import MCQOption, Question, QuestionType
from app.models.submission import Submission, SubmissionStatus
from app.services.piston_service import run_code


@dataclass
class CorrectionResult:
    submission_id: uuid.UUID
    total_score: float
    max_score: float


async def correct_submission(
    submission_id: uuid.UUID, db: AsyncSession
) -> CorrectionResult:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.answers).selectinload(Answer.question).selectinload(
                Question.options
            )
        )
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise ValueError(f"Submission {submission_id} not found")

    max_score = 0.0
    total_score = 0.0

    for answer in submission.answers:
        question = answer.question
        max_score += question.points
        earned, feedback, output = await _grade_answer(answer, question)
        answer.score = earned
        answer.feedback = feedback
        answer.execution_output = output
        total_score += earned

    submission.total_score = round(total_score, 2)
    submission.status = SubmissionStatus.corrected
    await db.commit()

    return CorrectionResult(
        submission_id=submission_id,
        total_score=round(total_score, 2),
        max_score=round(max_score, 2),
    )


async def _grade_answer(
    answer: Answer, question: Question
) -> tuple[float, str, str]:
    if question.type == QuestionType.mcq:
        return _grade_mcq(answer, question)
    return await _grade_coding(answer, question)


def _grade_mcq(answer: Answer, question: Question) -> tuple[float, str, str]:
    if answer.selected_option_id is None:
        return 0.0, "Aucune réponse sélectionnée.", ""

    correct_option = next(
        (opt for opt in question.options if opt.is_correct), None
    )
    if correct_option and answer.selected_option_id == correct_option.id:
        return question.points, "Correct.", ""

    correct_label = correct_option.label if correct_option else "?"
    return 0.0, f"Incorrect. La bonne réponse était : {correct_label}.", ""


def _extract_actual(stdout: str, expected: str) -> str:
    """Return the tail of stdout matching the number of lines in expected.

    Students often use input("prompt") which writes prompts to stdout before
    the actual output. By taking the last N lines (N = lines in expected) we
    ignore those prompts and compare only the meaningful output.
    """
    expected_lines = expected.splitlines()
    n = len(expected_lines)
    if n == 0:
        return stdout.strip()
    actual_lines = stdout.rstrip("\n").splitlines()
    tail = actual_lines[-n:] if len(actual_lines) >= n else actual_lines
    return "\n".join(tail).strip()


async def _grade_coding(answer: Answer, question: Question) -> tuple[float, str, str]:
    if not answer.code_written or not question.test_cases:
        return 0.0, "Aucun code soumis ou aucun test défini.", ""

    test_cases: list[dict] = question.test_cases  # type: ignore[assignment]
    total_weight = sum(float(tc.get("weight", 1)) for tc in test_cases)
    earned_weight = 0.0
    outputs: list[str] = []
    feedbacks: list[str] = []

    for i, tc in enumerate(test_cases, start=1):
        stdin = str(tc.get("input", ""))
        expected = str(tc.get("expected_output", "")).strip()
        weight = float(tc.get("weight", 1))

        try:
            piston_result = await run_code(answer.code_written, stdin=stdin)
            actual = _extract_actual(piston_result.stdout, expected)
            outputs.append(f"Test {i}: stdout={actual!r}, stderr={piston_result.stderr!r}")

            if actual == expected:
                earned_weight += weight
                feedbacks.append(f"Test {i}: ✓")
            else:
                feedbacks.append(f"Test {i}: ✗ (attendu={expected!r}, obtenu={actual!r})")
        except Exception as exc:
            outputs.append(f"Test {i}: erreur d'exécution — {exc}")
            feedbacks.append(f"Test {i}: ✗ (erreur d'exécution)")

    if total_weight == 0:
        score = 0.0
    else:
        score = round((earned_weight / total_weight) * question.points, 2)

    return score, "\n".join(feedbacks), "\n".join(outputs)
