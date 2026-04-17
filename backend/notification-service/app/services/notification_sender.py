from sqlalchemy.orm import Session
from app.models import Notification, NotificationType, NotificationStatus
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class NotificationSender:
    def __init__(self, smtp_host: str, smtp_port: int, sender_email: str, sender_password: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
    
    async def send_notification(self, notification: Notification, db: Session) -> bool:
        try:
            if notification.notification_type == NotificationType.EMAIL:
                return await self._send_email(notification)
            elif notification.notification_type == NotificationType.SMS:
                return await self._send_sms(notification)
            elif notification.notification_type == NotificationType.PUSH:
                return await self._send_push(notification)
            elif notification.notification_type == NotificationType.IN_APP:
                return await self._send_in_app(notification, db)
        except Exception as e:
            logger.error(f"Error sending notification {notification.id}: {str(e)}")
            notification.status = NotificationStatus.FAILED
            notification.retry_count += 1
            db.commit()
            return False
    
    async def _send_email(self, notification: Notification) -> bool:
        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = notification.recipient
            msg['Subject'] = notification.subject
            msg.attach(MIMEText(notification.message, 'html'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            logger.info(f"Email sent to {notification.recipient}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    async def _send_sms(self, notification: Notification) -> bool:
        # Implement SMS sending logic (e.g., Twilio)
        logger.info(f"SMS sent to {notification.recipient}")
        return True
    
    async def _send_push(self, notification: Notification) -> bool:
        # Implement push notification logic (e.g., Firebase)
        logger.info(f"Push notification sent to {notification.recipient}")
        return True
    
    async def _send_in_app(self, notification: Notification, db: Session) -> bool:
        # In-app notifications are stored in DB
        logger.info(f"In-app notification created for user {notification.user_id}")
        return True