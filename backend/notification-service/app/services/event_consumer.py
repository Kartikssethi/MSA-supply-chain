import asyncio
import json
import logging
from typing import Callable
from kafka import KafkaConsumer
from sqlalchemy.orm import Session
from app.models import Notification, NotificationType, NotificationStatus

logger = logging.getLogger(__name__)

class EventConsumer:
    def __init__(self, bootstrap_servers: str, group_id: str):
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.consumer = None
    
    def start(self, topic: str, callback: Callable):
        try:
            self.consumer = KafkaConsumer(
                topic,
                bootstrap_servers=self.bootstrap_servers,
                group_id=self.group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest'
            )
            
            logger.info(f"Started consuming from topic: {topic}")
            
            for message in self.consumer:
                try:
                    asyncio.run(callback(message.value))
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}")
    
    def stop(self):
        if self.consumer:
            self.consumer.close()
            logger.info("Consumer stopped")
    
    @staticmethod
    async def process_event(event: dict, db: Session, sender):
        try:
            notification = Notification(
                user_id=event.get('user_id'),
                notification_type=NotificationType(event.get('notification_type')),
                subject=event.get('subject'),
                message=event.get('message'),
                recipient=event.get('recipient'),
                status=NotificationStatus.PENDING
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            await sender.send_notification(notification, db)
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Notification {notification.id} processed successfully")
        except Exception as e:
            logger.error(f"Failed to process event: {str(e)}")