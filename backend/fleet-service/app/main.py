"""
app/main.py — Fleet Service entry point.
Run on Port 8002.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base
import app.models  # registers all models with Base.metadata
from app.api.routes import router as fleet_router
from app.redis_client import close_redis, startup_redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Fleet Service starting up…")
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database connected. Tables ready.")
    await startup_redis()
    yield
    # Shutdown
    await close_redis()
    await engine.dispose()
    logger.info("Fleet Service shut down.")


app = FastAPI(title="Fleet Service", lifespan=lifespan)

# CORS — allow frontend to talk to this service
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fleet_router, prefix="/fleet", tags=["Fleet"])


@app.get("/", tags=["Health"])
def health():
    return {"service": "fleet-service", "status": "ok"}
