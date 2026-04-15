"""
app/redis_client.py — Redis connectivity and Distributed Locking.

Uses redis-py's async lock to ensure cluster-safe concurrency control.
"""

import os
import time
import logging
from contextlib import asynccontextmanager
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Create a connection pool and client
redis_pool = redis.ConnectionPool.from_url(REDIS_URL)
redis_client = redis.Redis(connection_pool=redis_pool)

@asynccontextmanager
async def distributed_lock(name: str, timeout: int = 10, sleep: float = 0.1):
    """
    Context manager for a Redis-based distributed lock.
    name: The name of the lock (e.g. 'vehicle:123')
    timeout: How long before the lock expires (safety release)
    sleep: How long to wait between acquisition attempts
    """
    lock = redis_client.lock(f"lock:{name}", timeout=timeout, sleep=sleep)
    
    acquired = await lock.acquire(blocking=True)
    if not acquired:
        logger.error(f"Could not acquire lock: {name}")
        raise RuntimeError(f"Resource {name} is currently busy. Please try again.")

    try:
        logger.info(f"Lock acquired: {name}")
        yield lock
    finally:
        await lock.release()
        logger.info(f"Lock released: {name}")

async def close_redis():
    """Cleanup connection pool."""
    await redis_client.close()
    await redis_pool.disconnect()
