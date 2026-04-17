import logging
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from app.database import get_db
from app.models.trip import TripLocation
from app.schemas.location import LocationPing
from app.redis_client import set_driver_location, get_all_active_locations

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple Connection Manager for broadcasting
class ConnectionManager:
    def __init__(self):
        # We separate dispatchers (who listen to everything) and drivers
        self.dispatchers: List[WebSocket] = []
        self.drivers: Dict[str, WebSocket] = {}

    async def connect_dispatcher(self, websocket: WebSocket):
        await websocket.accept()
        self.dispatchers.append(websocket)
        logger.info("New Dispatcher connected. Total dispatchers: %s", len(self.dispatchers))

    def disconnect_dispatcher(self, websocket: WebSocket):
        if websocket in self.dispatchers:
            self.dispatchers.remove(websocket)

    async def connect_driver(self, websocket: WebSocket, driver_id: str):
        await websocket.accept()
        self.drivers[driver_id] = websocket
        logger.info("Driver %s connected.", driver_id)

    def disconnect_driver(self, driver_id: str):
        if driver_id in self.drivers:
            del self.drivers[driver_id]

    async def broadcast_to_dispatchers(self, message: dict):
        # Ensure timestamp is string for JSON serialization if it's a datetime
        # (Though we'll just send standard JSON objects usually)
        msg_str = json.dumps(message, default=str)
        for connection in self.dispatchers:
            try:
                await connection.send_text(msg_str)
            except Exception as e:
                logger.error(f"Error broadcasting to dispatcher: {e}")

manager = ConnectionManager()


@router.websocket("/ws/dispatcher")
async def dispatcher_endpoint(websocket: WebSocket):
    """
    Dispatchers connect here to listen to all live driver updates.
    """
    await manager.connect_dispatcher(websocket)
    try:
        # Give them the current state immediately upon connecting
        current_locations = await get_all_active_locations()
        if current_locations:
            await websocket.send_text(json.dumps({"type": "init", "data": current_locations}, default=str))

        while True:
            # Dispatchers generally just listen, but we need to keep connection alive
            data = await websocket.receive_text()
            # We can handle ping/pong here if needed
    except WebSocketDisconnect:
        manager.disconnect_dispatcher(websocket)
        logger.info("Dispatcher disconnected.")


@router.websocket("/ws/driver/{driver_id}")
async def driver_endpoint(websocket: WebSocket, driver_id: str):
    """
    Drivers connect here to send their GPS pings.
    """
    await manager.connect_driver(websocket, driver_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting JSON like: {"latitude": 40.71, "longitude": -74.01, "speed": 45}
            payload = json.loads(data)
            
            # Add timestamp if missing
            timestamp = datetime.utcnow()
            
            location_data = {
                "driver_id": driver_id,
                "latitude": payload.get("latitude"),
                "longitude": payload.get("longitude"),
                "speed": payload.get("speed"),
                "timestamp": timestamp.isoformat()
            }
            
            # Validate format visually (or through Pydantic)
            ping = LocationPing(**location_data)

            # 1. Update the cache (Redis or Memory)
            await set_driver_location(driver_id, location_data)

            # 2. Broadcast to all dispatchers watching the map
            await manager.broadcast_to_dispatchers({
                "type": "location_update",
                "data": location_data
            })
            
    except WebSocketDisconnect:
        manager.disconnect_driver(driver_id)
        logger.info(f"Driver {driver_id} disconnected.")
    except Exception as e:
        logger.error(f"Error in driver websocket for {driver_id}: {e}")
        manager.disconnect_driver(driver_id)


# API endpoint to manually flush the current cache to the DB for historical tracking
# (This can be called via a Cron job, or we can use a background task in FastAPI)
@router.post("/flush", status_code=201)
async def flush_cache_to_db(db: AsyncSession = Depends(get_db)):
    """
    Takes all current locations in cache and saves them as a batch to PostgreSQL.
    """
    locations = await get_all_active_locations()
    if not locations:
        return {"status": "skipped", "message": "No active locations to flush."}
    
    records = []
    for driver_id, data in locations.items():
        try:
            ts = datetime.fromisoformat(data["timestamp"])
        except:
            ts = datetime.utcnow()

        trip = TripLocation(
            driver_id=driver_id,
            latitude=data["latitude"],
            longitude=data["longitude"],
            speed=data.get("speed"),
            timestamp=ts
        )
        records.append(trip)
    
    db.add_all(records)
    await db.commit()
    
    return {"status": "success", "flushed_records": len(records)}
