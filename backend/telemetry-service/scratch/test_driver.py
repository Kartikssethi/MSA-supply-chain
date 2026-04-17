import asyncio
import websockets
import json
import random

async def simulate_driver(driver_id: str, start_lat: float, start_lng: float, d_lat: float, d_lng: float):
    uri = f"ws://localhost:8004/ws/driver/{driver_id}"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Driver {driver_id} connected!")
            
            lat = start_lat
            lng = start_lng
            
            while True:
                # Move smoothly in the given direction (driving) with slight natural variation
                lat += d_lat + random.uniform(-0.0001, 0.0001)
                lng += d_lng + random.uniform(-0.0001, 0.0001)
                
                # Keep in Manhattan bounds so they don't drive into the water
                if lat < 40.7000 or lat > 40.8100:
                    d_lat *= -1
                    lat = max(40.7000, min(lat, 40.8100))
                if lng < -74.0200 or lng > -73.9300:
                    d_lng *= -1
                    lng = max(-74.0200, min(lng, -73.9300))
                
                speed = random.uniform(40.0, 65.0)
                
                payload = {
                    "latitude": lat,
                    "longitude": lng,
                    "speed": speed
                }
                
                await websocket.send(json.dumps(payload))
                
                # Ping every 1.5 seconds for smooth UI
                await asyncio.sleep(1.5)
                
    except Exception as e:
        print(f"Driver {driver_id} error: {e}")

async def main():
    print("Starting Multi-Driver Simulation...")
    # Simulate all 4 drivers from the mock data starting around New York
    # Each driver gets a slightly different constant velocity vector
    await asyncio.gather(
        simulate_driver("d1", 40.7580, -73.9855, 0.0005, -0.0002),
        simulate_driver("d2", 40.7600, -73.9800, -0.0003, 0.0004),
        simulate_driver("d3", 40.7500, -73.9900, 0.0002, 0.0005),
        simulate_driver("d4", 40.7480, -73.9850, -0.0004, -0.0001),
    )

if __name__ == "__main__":
    asyncio.run(main())
