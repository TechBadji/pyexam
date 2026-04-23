"""Seed script — run inside the backend container after migrations.

Usage: docker-compose exec backend python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.exam import Exam, ExamStatus
from app.models.question import MCQOption, Question, QuestionType
from app.models.user import PreferredLanguage, User, UserRole
from app.services.auth_service import hash_password


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # ── Check idempotency ─────────────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "admin@pyexam.com"))
        if existing.scalar_one_or_none() is not None:
            print("Seed already applied — skipping.")
            return

        # ── Admin ─────────────────────────────────────────────────────────────
        admin = User(
            email="admin@pyexam.com",
            full_name="Administrateur PyExam",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            preferred_language=PreferredLanguage.fr,
        )
        db.add(admin)

        # ── Students ──────────────────────────────────────────────────────────
        students = [
            User(
                email=f"student{i}@pyexam.com",
                full_name=f"Étudiant {i}",
                hashed_password=hash_password("student123"),
                role=UserRole.student,
                student_number=f"202400{i}",
                preferred_language=PreferredLanguage.fr,
            )
            for i in range(1, 4)
        ]
        for s in students:
            db.add(s)

        await db.flush()

        # ── Exam ──────────────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)
        exam = Exam(
            title="Fondamentaux Python / Python Fundamentals",
            description="Examen couvrant les bases du langage Python : types, structures de données et algorithmes.",
            duration_minutes=180,
            start_time=now - timedelta(minutes=5),
            end_time=now + timedelta(hours=3),
            status=ExamStatus.active,
            created_by=admin.id,
        )
        db.add(exam)
        await db.flush()

        # ── MCQ Q1 ────────────────────────────────────────────────────────────
        q1 = Question(
            exam_id=exam.id,
            type=QuestionType.mcq,
            order_index=1,
            points=1.0,
            statement="Quel type retourne type(42) ?",
        )
        db.add(q1)
        await db.flush()
        for label, text, correct in [
            ("A", "int", True),
            ("B", "float", False),
            ("C", "str", False),
            ("D", "bool", False),
        ]:
            db.add(MCQOption(question_id=q1.id, label=label, text=text, is_correct=correct))

        # ── MCQ Q2 ────────────────────────────────────────────────────────────
        q2 = Question(
            exam_id=exam.id,
            type=QuestionType.mcq,
            order_index=2,
            points=1.0,
            statement="Quelle méthode ajoute un élément à une liste ?",
        )
        db.add(q2)
        await db.flush()
        for label, text, correct in [
            ("A", "add()", False),
            ("B", "insert()", False),
            ("C", "append()", True),
            ("D", "push()", False),
        ]:
            db.add(MCQOption(question_id=q2.id, label=label, text=text, is_correct=correct))

        # ── MCQ Q3 ────────────────────────────────────────────────────────────
        q3 = Question(
            exam_id=exam.id,
            type=QuestionType.mcq,
            order_index=3,
            points=1.0,
            statement="Qu'affiche print(10 // 3) ?",
        )
        db.add(q3)
        await db.flush()
        for label, text, correct in [
            ("A", "3.33", False),
            ("B", "3", True),
            ("C", "4", False),
            ("D", "1", False),
        ]:
            db.add(MCQOption(question_id=q3.id, label=label, text=text, is_correct=correct))

        # ── Coding Q4 ─────────────────────────────────────────────────────────
        q4 = Question(
            exam_id=exam.id,
            type=QuestionType.coding,
            order_index=4,
            points=3.0,
            statement=(
                "Écrire une fonction fibonacci(n) qui retourne le nième terme de la suite de Fibonacci.\n"
                "Exemples : fibonacci(0) → 0, fibonacci(1) → 1, fibonacci(10) → 55\n"
                "Votre code doit lire n depuis stdin et afficher le résultat."
            ),
            test_cases=[
                {"input": "0", "expected_output": "0", "weight": 1},
                {"input": "1", "expected_output": "1", "weight": 1},
                {"input": "10", "expected_output": "55", "weight": 1},
            ],
        )
        db.add(q4)

        # ── Coding Q5 ─────────────────────────────────────────────────────────
        q5 = Question(
            exam_id=exam.id,
            type=QuestionType.coding,
            order_index=5,
            points=3.0,
            statement=(
                "Écrire une fonction is_palindrome(s) qui retourne True si la chaîne s est un palindrome, False sinon.\n"
                "Votre code doit lire s depuis stdin et afficher True ou False."
            ),
            test_cases=[
                {"input": "racecar", "expected_output": "True", "weight": 1},
                {"input": "hello", "expected_output": "False", "weight": 1},
                {"input": "madam", "expected_output": "True", "weight": 1},
            ],
        )
        db.add(q5)

        await db.commit()

        print("✓ Seed applied successfully!")
        print("  Admin   : admin@pyexam.com / admin123")
        print("  Students: student1@pyexam.com, student2@pyexam.com, student3@pyexam.com / student123")
        print(f"  Exam    : {exam.title} (active, 180 min, 5 questions)")


if __name__ == "__main__":
    asyncio.run(seed())
