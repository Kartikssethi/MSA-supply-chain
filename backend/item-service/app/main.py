"""
app/main.py — Item Service entry point.
Run from item-service/ directory: uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base
import app.models  # registers all models with Base.metadata
from app.api.routes import router as items_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Item Service starting up…")
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database connected. Tables ready.")
    yield
    await engine.dispose()
    logger.info("Item Service shut down.")


app = FastAPI(title="Item Service", lifespan=lifespan)

app.include_router(items_router, prefix="/items", tags=["Items"])


@app.get("/", tags=["Health"])
def health():
    return {"service": "item-service", "status": "ok"}
