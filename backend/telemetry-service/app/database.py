"""
app/database.py — Telemetry Service's own DB connection.
Same pattern as auth and fleet services.
"""

import os
import logging
import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

# Load from ../.env (root backend folder)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

logger = logging.getLogger(__name__)

_raw_url: str = os.getenv("DATABASE_URL", "").strip()
if not _raw_url:
    raise RuntimeError("DATABASE_URL is not set in backend/.env")

# Strip query parameters (like ?pgbouncer=true) which cause TypeError in asyncpg
# and prepare the async URL
_clean_url = _raw_url.split("?")[0]
ASYNC_DATABASE_URL = _clean_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create SSL context to handle self-signed certificates (common in Supabase/managed DBs)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args={
        "ssl": ssl_context,
        "timeout": 60,
        "statement_cache_size": 0
    },
)

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
