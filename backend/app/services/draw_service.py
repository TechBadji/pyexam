"""Random question draw for session-based exams."""
import random
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question, QuestionType


async def draw_questions(
    exam_id: uuid.UUID,
    draw_config: dict,
    db: AsyncSession,
) -> list[uuid.UUID]:
    """
    Randomly draw question IDs from the exam question pool according to draw_config.

    draw_config shape:
      {
        "n_mcq": int,           # number of MCQ questions to draw
        "n_coding": int,        # number of coding questions to draw
      }

    Returns a list of Question.id values (subset of the exam's pool).
    """
    n_mcq: int = int(draw_config.get("n_mcq", 0))
    n_coding: int = int(draw_config.get("n_coding", 0))

    result = await db.execute(
        select(Question.id, Question.type).where(Question.exam_id == exam_id)
    )
    rows = result.all()

    mcq_pool = [r.id for r in rows if r.type == QuestionType.mcq]
    coding_pool = [r.id for r in rows if r.type == QuestionType.coding]

    drawn_mcq = random.sample(mcq_pool, min(n_mcq, len(mcq_pool)))
    drawn_coding = random.sample(coding_pool, min(n_coding, len(coding_pool)))

    all_drawn = drawn_mcq + drawn_coding
    random.shuffle(all_drawn)
    return all_drawn


def snapshot_bank_question(bq) -> dict:
    """Serialize a BankQuestion + its options into an immutable snapshot dict."""
    return {
        "id": str(bq.id),
        "type": bq.type.value,
        "difficulty": bq.difficulty.value,
        "tags": list(bq.tags),
        "statement": bq.statement,
        "points": bq.points,
        "test_cases": bq.test_cases,
        "version": bq.version,
        "options": [
            {
                "id": str(o.id),
                "label": o.label,
                "text": o.text,
                "is_correct": o.is_correct,
            }
            for o in bq.options
        ],
    }
