import asyncio
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log(
    user_id: uuid.UUID,
    action: str,
    db: AsyncSession,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Fire-and-forget audit log. Never raises — swallows all errors."""

    async def _insert() -> None:
        try:
            entry = AuditLog(user_id=user_id, action=action, metadata=metadata)
            db.add(entry)
            await db.flush()
        except Exception:
            pass

    asyncio.ensure_future(_insert())
