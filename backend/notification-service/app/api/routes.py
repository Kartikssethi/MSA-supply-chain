from fastapi import APIRouter
from app.api import socketio

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@router.get("/notifications")
async def get_notifications():
    """Get notification service status"""
    return {
        "service": "notification-service",
        "websocket_active": True,
        "message": "Connected to Kafka consumer"
    }