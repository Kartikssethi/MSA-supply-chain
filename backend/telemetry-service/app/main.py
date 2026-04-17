"""
app/main.py — Telemetry Service entry point.
Run from telemetry-service/ directory: uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
import app.models.trip  # registers all models with Base.metadata
from app.redis_client import init_redis, close_redis
from app.api.websocket import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Telemetry Service starting up…")
    
    # Init DB
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            # Auto-create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database schema verified.")
    except Exception as e:
        logger.warning(f"⚠️ Could not connect to Database on startup: {e}. Running without persistent DB save.")


    # Init Redis Cache / Fallback
    await init_redis()

    logger.info("✅ Telemetry Service Ready.")
    yield
    
    # Shutdown
    await close_redis()
    await engine.dispose()
    logger.info("Telemetry Service shut down.")

app = FastAPI(title="Telemetry Service", lifespan=lifespan)

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(ws_router)

@app.get("/", tags=["Health"])
def health():
    return {"service": "telemetry-service", "status": "ok"}
