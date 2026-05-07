import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log(
    user_id: uuid.UUID,
    action: str,
    db: AsyncSession,
    extra_data: dict[str, Any] | None = None,
) -> None:
    """Audit log — never raises, swallows all errors."""
    try:
        entry = AuditLog(user_id=user_id, action=action, extra_data=extra_data)
        db.add(entry)
        await db.flush()
    except Exception:
        pass
