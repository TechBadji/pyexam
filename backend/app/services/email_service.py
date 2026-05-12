import uuid
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.i18n.utils import get_translation
from app.models.answer import Answer
from app.models.exam import Exam
from app.models.question import Question
from app.models.submission import Submission
from app.models.user import User


async def send_verification_email(email: str, full_name: str, code: str, lang: str) -> None:
    if lang == "fr":
        subject = "Votre code de vérification PyExam"
        heading = "Vérifiez votre adresse e-mail"
        body_text = f"Bonjour {full_name}, votre code de vérification est :"
        expiry = "Ce code expire dans 15 minutes."
    else:
        subject = "Your PyExam verification code"
        heading = "Verify your email address"
        body_text = f"Hello {full_name}, your verification code is:"
        expiry = "This code expires in 15 minutes."

    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#4f46e5">{heading}</h2>
      <p>{body_text}</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;
                  padding:24px;background:#f5f3ff;border-radius:12px;color:#4f46e5;margin:24px 0">
        {code}
      </div>
      <p style="color:#888;font-size:12px">{expiry}</p>
    </body></html>
    """
    await _send(email, subject, html)


async def send_password_reset_email(email: str, full_name: str, reset_url: str, lang: str) -> None:
    if lang == "fr":
        subject = "Réinitialisation de votre mot de passe PyExam"
        heading = "Réinitialisez votre mot de passe"
        body_text = f"Bonjour {full_name}, cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :"
        button_text = "Réinitialiser mon mot de passe"
        expiry = "Ce lien expire dans 15 minutes."
        ignore = "Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail."
    else:
        subject = "Reset your PyExam password"
        heading = "Reset your password"
        body_text = f"Hello {full_name}, click the button below to reset your password:"
        button_text = "Reset my password"
        expiry = "This link expires in 15 minutes."
        ignore = "If you did not request this, you can safely ignore this email."

    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#4f46e5">{heading}</h2>
      <p>{body_text}</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{reset_url}"
           style="display:inline-block;padding:14px 32px;background:#4f46e5;color:white;
                  text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px">
          {button_text}
        </a>
      </div>
      <p style="color:#888;font-size:12px">{expiry}</p>
      <p style="color:#888;font-size:12px">{ignore}</p>
    </body></html>
    """
    await _send(email, subject, html)


async def _send(to: str, subject: str, html: str) -> None:
    """Send an HTML email via SMTP (async). Silently skips if SMTP_USER is not configured."""
    if not settings.SMTP_USER:
        print(f"[EMAIL] No SMTP_USER configured — skipping email to {to} | {subject}", flush=True)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


def _fmt_date(dt: datetime, lang: str) -> str:
    if lang == "en":
        return dt.strftime("%m/%d/%Y %I:%M %p")
    return dt.strftime("%d/%m/%Y %H:%M")


def _fmt_score(value: float, lang: str) -> str:
    s = f"{value:.1f}"
    return s.replace(".", ",") if lang == "fr" else s


async def _load_submission_data(
    submission_id: uuid.UUID, db: AsyncSession
) -> tuple[Submission, User, Exam]:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.exam),
            selectinload(Submission.answers)
            .selectinload(Answer.question)
            .selectinload(Question.options),
        )
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise ValueError(f"Submission {submission_id} not found")
    return submission, submission.student, submission.exam


async def send_result_email(submission_id: uuid.UUID, db: AsyncSession) -> None:
    submission, student, exam = await _load_submission_data(submission_id, db)
    lang = student.preferred_language.value

    total = submission.total_score or 0.0
    max_score = sum(a.question.points for a in submission.answers)
    threshold_pct = exam.passing_threshold if exam.passing_threshold is not None else settings.PASSING_GRADE_PERCENT
    passed = (total / max_score * 100 >= threshold_pct) if max_score > 0 else False

    subject = get_translation("email.subject", lang, exam_title=exam.title)
    greeting = get_translation("email.greeting", lang, full_name=student.full_name)
    announcement = get_translation("email.results_announcement", lang, exam_title=exam.title)
    score_label = get_translation("email.total_score_label", lang)
    pts_label = get_translation("email.points_label", lang)
    status_msg = get_translation("email.pass_message" if passed else "email.fail_message", lang)
    breakdown_header = get_translation("email.breakdown_header", lang)
    feedback_label = get_translation("email.feedback_label", lang)
    footer = get_translation("email.footer", lang, institution_name=settings.INSTITUTION_NAME)

    rows = ""
    for answer in sorted(submission.answers, key=lambda a: a.question.order_index):
        q = answer.question
        earned = answer.score or 0.0
        feedback = answer.feedback or ""
        rows += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">{q.statement[:120]}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">
            {_fmt_score(earned, lang)} / {_fmt_score(q.points, lang)} {pts_label}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#555">{feedback}</td>
        </tr>
        """

    status_color = "#16a34a" if passed else "#dc2626"
    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px">
    <p>{greeting}</p>
    <p>{announcement}</p>
    <p><strong>{score_label} :</strong>
       <span style="font-size:1.4em;color:{status_color}">
         {_fmt_score(total, lang)} / {_fmt_score(max_score, lang)} {pts_label}
       </span>
    </p>
    <p style="color:{status_color};font-weight:bold">{status_msg}</p>
    <h3>{breakdown_header}</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px;text-align:left">Question</th>
          <th style="padding:8px">Score</th>
          <th style="padding:8px;text-align:left">{feedback_label}</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    <hr style="margin:32px 0">
    <p style="color:#888;font-size:12px">{footer}</p>
    </body></html>
    """

    await _send(student.email, subject, html)
