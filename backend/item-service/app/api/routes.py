"""
app/api/routes.py — Item Service API routes.
"""

import random
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.item import Item

router = APIRouter()

RANDOM_NAMES = ["Widget", "Gadget", "Doohickey", "Thingamajig", "Gizmo", "Sprocket", "Doodad"]
RANDOM_DESCS = ["A shiny one", "Slightly used", "Brand new", "Limited edition", "Deluxe version"]


@router.post("/random")
async def add_random_item(db: AsyncSession = Depends(get_db)):
    """Insert a randomly generated item into the database."""
    item = Item(
        id=uuid.uuid4(),
        name=f"{random.choice(RANDOM_NAMES)}-{random.randint(100, 999)}",
        description=random.choice(RANDOM_DESCS),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {
        "message": "Random item added ✅",
        "item": {
            "id": str(item.id),
            "name": item.name,
            "description": item.description,
            "created_at": item.created_at.isoformat(),
        },
    }


@router.get("/")
async def list_items(db: AsyncSession = Depends(get_db)):
    """Return all items from the database."""
    result = await db.execute(select(Item).order_by(Item.created_at.desc()))
    items = result.scalars().all()
    return {
        "count": len(items),
        "items": [
            {
                "id": str(i.id),
                "name": i.name,
                "description": i.description,
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
    }
