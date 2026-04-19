import asyncio
import logging
import httpx
from datetime import datetime
import json
from app.api.websocket import manager
from app.redis_client import set_driver_location

logger = logging.getLogger(__name__)

# To prevent duplicate simulations for the same driver
ACTIVE_SIMULATIONS = set()

async def fetch_route_osrm(origin_lng: float, origin_lat: float, dest_lng: float, dest_lat: float):
    """
    Fetches the actual road network route between Origin and Destination using OSRM's public A* engine.
    """
    url = f"http://router.project-osrm.org/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("routes") and len(data["routes"]) > 0:
                    # coordinates represent the strictly road-bound polyline
                    coordinates = data["routes"][0]["geometry"]["coordinates"]
                    duration_sec = data["routes"][0]["duration"]
                    distance_meters = data["routes"][0]["distance"]
                    return coordinates, duration_sec, distance_meters
    except Exception as e:
        logger.error(f"Failed to fetch route from OSRM: {e}")
    return None, None, None

async def simulate_driver_trip(driver_id: str, driver_name: str, coordinates: list, duration_sec: float):
    """
    Simulates a driver moving along the coordinates.
    Sends real-time websocket and redis updates.
    """
    if driver_id in ACTIVE_SIMULATIONS:
        logger.warning(f"Driver {driver_id} is already being simulated.")
        return
    
    ACTIVE_SIMULATIONS.add(driver_id)
    
    try:
        if not coordinates:
            logger.error("No coordinates provided for simulation.")
            return

        total_steps = len(coordinates)
        if total_steps == 0:
            return

        # Aim for realistic movement intervals. 
        # If the trip is 600 seconds but there are 100 coordinates,
        # we realistically jump point to point every ~6 seconds.
        # But for demo purposes, we will scale time to make it faster.
        # Demo time speed multiplier: 10x
        time_multiplier = 10.0
        sleep_interval = duration_sec / total_steps / time_multiplier

        # Cap the sleep to keep the simulation visually responsive in demo
        if sleep_interval > 3.0:
            sleep_interval = 3.0
        if sleep_interval < 0.5:
            sleep_interval = 0.5

        logger.info(f"Starting simulation for Driver {driver_id} over {total_steps} points. Step interval: {sleep_interval:.2f}s")

        for idx, point in enumerate(coordinates):
            if driver_id not in ACTIVE_SIMULATIONS:
                break # Interrupted

            lng, lat = point
            
            # Simulated speed (random or average)
            speed = 45.0  # mph / kmh

            location_data = {
                "driver_id": driver_id,
                "driver_name": driver_name,
                "latitude": lat,
                "longitude": lng,
                "speed": speed,
                "timestamp": datetime.utcnow().isoformat()
            }

            # 1. Update cache
            await set_driver_location(driver_id, location_data)

            # 2. Broadcast to dispatchers
            await manager.broadcast_to_dispatchers({
                "type": "location_update",
                "data": location_data
            })

            # Wait before moving to next point
            await asyncio.sleep(sleep_interval)

        logger.info(f"Simulation completed for Driver {driver_id}.")

    finally:
        ACTIVE_SIMULATIONS.discard(driver_id)

def stop_simulation(driver_id: str):
    ACTIVE_SIMULATIONS.discard(driver_id)
