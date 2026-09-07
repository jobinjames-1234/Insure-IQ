import json
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings

# Global Redis pool
redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

async def cache_get(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    data = await redis_client.get(key)
    if data:
        return json.loads(data)
    return None

async def cache_set(key: str, value: Any, expire_seconds: int = 3600) -> None:
    if not redis_client:
        return
    await redis_client.set(key, json.dumps(value), ex=expire_seconds)

async def cache_delete(key: str) -> None:
    if not redis_client:
        return
    await redis_client.delete(key)
