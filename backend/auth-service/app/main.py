"""
app/main.py — Auth Service entry point.
Run from auth-service/ directory: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
import app.models  # registers all models with Base.metadata
from app.api.routes import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Auth Service starting up…")
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        # Auto-create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database connected. Tables ready.")
    yield
    await engine.dispose()
    logger.info("Auth Service shut down.")


app = FastAPI(title="Auth Service", lifespan=lifespan)

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router, prefix="/auth", tags=["Auth"])


@app.get("/", tags=["Health"])
def health():
    return {"service": "auth-service", "status": "ok"}
