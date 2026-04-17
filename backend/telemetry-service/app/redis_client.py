"""
app/redis_client.py — Redis connectivity for Telemetry Cache
Falls back to an in-memory dictionary if Redis is unavailable.
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379").strip()

_redis_client = None
_use_redis = False

# Fallback memory cache for tracking driver locations
# Format: { "driver_123": { "lat": ..., "lng": ..., "timestamp": ... } }
_memory_cache: Dict[str, Dict[str, Any]] = {}

async def init_redis():
    """Attempt to connect to Redis."""
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
        logger.warning(f"⚠️  Redis unavailable ({e}). Falling back to local memory cache.")
        _use_redis = False
        return False

async def close_redis():
    if _redis_client:
        await _redis_client.close()

async def set_driver_location(driver_id: str, location_data: dict):
    """Save the driver's latest location to the cache."""
    if _use_redis and _redis_client:
        await _redis_client.set(f"driver:{driver_id}", json.dumps(location_data))
    else:
        _memory_cache[driver_id] = location_data

async def get_driver_location(driver_id: str) -> Optional[dict]:
    """Retrieve the driver's latest location from the cache."""
    if _use_redis and _redis_client:
        loc = await _redis_client.get(f"driver:{driver_id}")
        return json.loads(loc) if loc else None
    else:
        return _memory_cache.get(driver_id)

async def get_all_active_locations() -> Dict[str, dict]:
    """Retrieve all known driver locations."""
    if _use_redis and _redis_client:
        keys = await _redis_client.keys("driver:*")
        locations = {}
        for key in keys:
            loc = await _redis_client.get(key)
            if loc:
                # Key is typically 'b"driver:123"' in some redis clients, handle decoding
                driver_id = key.decode("utf-8").replace("driver:", "") if isinstance(key, bytes) else key.replace("driver:", "")
                locations[driver_id] = json.loads(loc)
        return locations
    else:
        return dict(_memory_cache)

async def clear_all_locations():
    """Clear the cache (useful after saving to DB)."""
    if _use_redis and _redis_client:
        keys = await _redis_client.keys("driver:*")
        if keys:
            await _redis_client.delete(*keys)
    else:
        _memory_cache.clear()
