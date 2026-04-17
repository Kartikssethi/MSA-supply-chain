from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app import init_db, logger
from app.services import WebSocketManager, NotificationSender, EventConsumer, DeduplicationService
from app.database import get_db
from sqlalchemy.orm import Session
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize services
ws_manager = WebSocketManager()
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
dedup_service = DeduplicationService(redis_client)
sender = NotificationSender(
    smtp_host="smtp.gmail.com",
    smtp_port=587,
    sender_email="your-email@gmail.com",
    sender_password="your-password"
)
event_consumer = EventConsumer(bootstrap_servers="localhost:9092", group_id="notification-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Notification Service...")
    init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Notification Service...")
    event_consumer.stop()


# Create FastAPI app
app = FastAPI(
    title="Notification Service",
    description="Microservice for managing notifications in supply chain",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "notification-service"
    }


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time notifications"""
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from user {user_id}: {data}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        ws_manager.disconnect(user_id, websocket)


@app.post("/api/notifications/send")
async def send_notification(
    user_id: int,
    notification_type: str,
    subject: str,
    message: str,
    recipient: str,
    db: Session = Depends(get_db)
):
    """Send a notification"""
    from app.models import Notification, NotificationType, NotificationStatus
    
    try:
        # Check for duplicates
        if dedup_service.is_duplicate(user_id, message, recipient):
            logger.warning(f"Duplicate notification detected for user {user_id}")
            return {"status": "duplicate", "message": "Notification already sent"}
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            notification_type=NotificationType(notification_type),
            subject=subject,
            message=message,
            recipient=recipient,
            status=NotificationStatus.PENDING
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Send notification
        success = await sender.send_notification(notification, db)
        
        if success:
            notification.status = NotificationStatus.SENT
            dedup_service.mark_as_sent(user_id, message, recipient)
            
            # Broadcast to WebSocket
            await ws_manager.broadcast_to_user(user_id, {
                "type": "notification",
                "id": notification.id,
                "message": message,
                "status": "sent"
            })
        else:
            notification.status = NotificationStatus.FAILED
        
        db.commit()
        
        return {
            "status": "success",
            "notification_id": notification.id,
            "message": "Notification sent"
        }
    
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        return {"status": "error", "message": str(e)}


@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: int, db: Session = Depends(get_db)):
    """Get all notifications for a user"""
    from app.models import Notification
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).all()
    
    return {
        "user_id": user_id,
        "count": len(notifications),
        "notifications": [
            {
                "id": n.id,
                "type": n.notification_type.value,
                "subject": n.subject,
                "message": n.message,
                "status": n.status.value,
                "created_at": n.created_at.isoformat(),
                "is_read": n.is_read
            }
            for n in notifications
        ]
    }


@app.put("/api/notifications/{notification_id}/read")
async def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    from app.models import Notification
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        return {"status": "error", "message": "Notification not found"}
    
    notification.is_read = True
    db.commit()
    
    return {"status": "success", "message": "Notification marked as read"}


@app.delete("/api/notifications/{notification_id}")
async def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    from app.models import Notification
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        return {"status": "error", "message": "Notification not found"}
    
    db.delete(notification)
    db.commit()
    
    return {"status": "success", "message": "Notification deleted"}


@app.get("/api/notifications/{user_id}/pending")
async def get_pending_notifications(user_id: int, db: Session = Depends(get_db)):
    """Get pending notifications for a user"""
    from app.models import Notification, NotificationStatus
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status == NotificationStatus.PENDING
    ).all()
    
    return {
        "user_id": user_id,
        "count": len(notifications),
        "notifications": [
            {
                "id": n.id,
                "type": n.notification_type.value,
                "message": n.message,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)