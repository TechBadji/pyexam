import secrets

import redis.asyncio as aioredis

from app.config import settings

_TTL = 900  # 15 minutes


def _key(email: str) -> str:
    return f"email_verify:{email}"


async def store_verification_code(email: str) -> str:
    code = f"{secrets.randbelow(900000) + 100000}"
    async with aioredis.from_url(settings.REDIS_URL, decode_responses=True) as client:
        await client.setex(_key(email), _TTL, code)
    return code


async def get_verification_code(email: str) -> str | None:
    async with aioredis.from_url(settings.REDIS_URL, decode_responses=True) as client:
        return await client.get(_key(email))


async def delete_verification_code(email: str) -> None:
    async with aioredis.from_url(settings.REDIS_URL, decode_responses=True) as client:
        await client.delete(_key(email))
