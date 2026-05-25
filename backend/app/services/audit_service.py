import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def log(
    user_id: uuid.UUID,
    action: str,
    db: AsyncSession,
    extra_data: dict[str, Any] | None = None,
) -> None:
    """Audit log — never raises, but logs failures so they are visible."""
    try:
        entry = AuditLog(user_id=user_id, action=action, extra_data=extra_data)
        db.add(entry)
        await db.flush()
    except Exception:
        logger.exception("audit_log failed: action=%s user_id=%s", action, user_id)
