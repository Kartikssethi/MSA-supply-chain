import hashlib
import logging
from typing import Optional
from datetime import datetime, timedelta
import redis

logger = logging.getLogger(__name__)

class DeduplicationService:
    def __init__(self, redis_client: redis.Redis, ttl_hours: int = 24):
        self.redis_client = redis_client
        self.ttl_seconds = ttl_hours * 3600
    
    def _generate_hash(self, user_id: int, message: str, recipient: str) -> str:
        content = f"{user_id}:{message}:{recipient}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def is_duplicate(self, user_id: int, message: str, recipient: str) -> bool:
        hash_key = self._generate_hash(user_id, message, recipient)
        key = f"notification:dedup:{hash_key}"
        
        try:
            exists = self.redis_client.exists(key)
            return bool(exists)
        except Exception as e:
            logger.error(f"Redis error checking duplicate: {str(e)}")
            return False
    
    def mark_as_sent(self, user_id: int, message: str, recipient: str) -> bool:
        hash_key = self._generate_hash(user_id, message, recipient)
        key = f"notification:dedup:{hash_key}"
        
        try:
            self.redis_client.setex(key, self.ttl_seconds, "1")
            logger.info(f"Marked notification as sent: {hash_key}")
            return True
        except Exception as e:
            logger.error(f"Redis error marking as sent: {str(e)}")
            return False
    
    def cleanup_expired(self) -> int:
        try:
            pattern = "notification:dedup:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
            return 0