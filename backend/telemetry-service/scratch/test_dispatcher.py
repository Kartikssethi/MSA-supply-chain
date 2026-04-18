import asyncio
import websockets
import json

async def listen_dispatcher():
    uri = "ws://localhost:8004/ws/dispatcher"
    print(f"Connecting Dispatcher to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Dispatcher connected! Listening for live driver updates...")
            
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                
                if data.get("type") == "init":
                    print(f"Initial State: {json.dumps(data['data'], indent=2)}")
                elif data.get("type") == "location_update":
                    print(f"Live Update: Driver {data['data']['driver_id']} is moving at {data['data']['speed']:.1f} mph")
                else:
                    print(f"Unknown message type: {data}")
                
    except Exception as e:
        print(f"Dispatcher error: {e}")

if __name__ == "__main__":
    asyncio.run(listen_dispatcher())
