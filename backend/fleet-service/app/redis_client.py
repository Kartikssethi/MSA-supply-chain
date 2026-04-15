"""
app/redis_client.py — Redis connectivity and Distributed Locking.

Falls back to an in-memory asyncio lock if Redis is unavailable,
so local development works even without a Redis server.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Try to connect to Redis; fall back to in-memory locks if it fails
_redis_client = None
_use_redis = False
_memory_locks: dict[str, asyncio.Lock] = {}

async def _init_redis():
    """Attempt to connect to Redis. Returns True if successful."""
    global _redis_client, _use_redis
    try:
        import redis.asyncio as redis
        client = redis.from_url(REDIS_URL)
        await client.ping()
        _redis_client = client
        _use_redis = True
        logger.info(f"✅ Connected to Redis at {REDIS_URL}")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Redis unavailable ({e}). Using in-memory locks (single-process only).")
        _use_redis = False
        return False

@asynccontextmanager
async def distributed_lock(name: str, timeout: int = 10, sleep: float = 0.1):
    """
    Context manager for a distributed lock.
    
    Uses Redis if available, otherwise falls back to asyncio.Lock
    for single-process concurrency safety during local development.
    """
    if _use_redis and _redis_client:
        lock = _redis_client.lock(f"lock:{name}", timeout=timeout, sleep=sleep)
        acquired = await lock.acquire(blocking_timeout=5)
        if not acquired:
            logger.error(f"Could not acquire Redis lock: {name}")
            raise RuntimeError(f"Resource {name} is currently busy. Please try again.")
        try:
            logger.info(f"Redis lock acquired: {name}")
            yield lock
        finally:
            try:
                await lock.release()
            except Exception:
                pass  # Lock may have already expired
            logger.info(f"Redis lock released: {name}")
    else:
        # Fallback: in-memory asyncio lock
        if name not in _memory_locks:
            _memory_locks[name] = asyncio.Lock()
        
        async with _memory_locks[name]:
            logger.info(f"Memory lock acquired: {name}")
            yield None
            logger.info(f"Memory lock released: {name}")

async def startup_redis():
    """Call during app startup to attempt Redis connection."""
    await _init_redis()

async def close_redis():
    """Cleanup connection pool."""
    if _redis_client:
        await _redis_client.close()
