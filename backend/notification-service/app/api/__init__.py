from fastapi import APIRouter
from fastapi_socketio import SocketManager
import json
from app.kafka.consumer import consume_events

router = APIRouter()

# Initialize SocketIO for real-time notifications
socketio = SocketManager(
    async_mode='asgi',
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25
)

@socketio.on('connect')
async def handle_connect(sid, environ):
    print(f"Client connected: {sid}")

@socketio.on('disconnect')
async def handle_disconnect(sid):
    print(f"Client disconnected: {sid}")

async def broadcast_shipment_notification(event_data: dict):
    """Called when Kafka messages arrive from shipment-service"""
    await socketio.emit('shipment_update', event_data, broadcast=True)

# Start Kafka consumer that listens to shipment events
def start_kafka_listener():
    """Background task to consume Kafka events and broadcast"""
    import asyncio
    asyncio.create_task(consume_events(broadcast_shipment_notification))