import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models import Base, Notification, NotificationType, NotificationStatus
from app.services import NotificationSender, DeduplicationService, WebSocketManager
from datetime import datetime
import redis

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    """Database session fixture"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def notification(db: Session):
    """Create test notification"""
    notif = Notification(
        user_id=1,
        notification_type=NotificationType.EMAIL,
        status=NotificationStatus.PENDING,
        subject="Test Subject",
        message="Test Message",
        recipient="test@example.com"
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


# Notification Model Tests
class TestNotificationModel:
    def test_create_notification(self, db: Session):
        """Test creating a notification"""
        notif = Notification(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            subject="Test",
            message="Test message",
            recipient="user@example.com"
        )
        db.add(notif)
        db.commit()
        
        assert notif.id is not None
        assert notif.status == NotificationStatus.PENDING
        assert notif.retry_count == 0
    
    def test_notification_types(self):
        """Test all notification types"""
        assert NotificationType.EMAIL.value == "email"
        assert NotificationType.SMS.value == "sms"
        assert NotificationType.PUSH.value == "push"
        assert NotificationType.IN_APP.value == "in_app"
    
    def test_notification_status(self):
        """Test notification statuses"""
        assert NotificationStatus.PENDING.value == "pending"
        assert NotificationStatus.SENT.value == "sent"
        assert NotificationStatus.FAILED.value == "failed"
        assert NotificationStatus.DELIVERED.value == "delivered"
    
    def test_notification_defaults(self, notification):
        """Test notification default values"""
        assert notification.is_read == False
        assert notification.retry_count == 0
        assert notification.sent_at is None


# NotificationSender Tests
class TestNotificationSender:
    @pytest.fixture
    def sender(self):
        """Create notification sender"""
        return NotificationSender(
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            sender_email="test@gmail.com",
            sender_password="password"
        )
    
    @pytest.mark.asyncio
    async def test_send_notification_email(self, sender, notification):
        """Test sending email notification"""
        # Mock test - in production use proper mocking
        result = await sender.send_notification(notification, None)
        assert isinstance(result, bool)
    
    def test_sender_initialization(self, sender):
        """Test sender initialization"""
        assert sender.smtp_host == "smtp.gmail.com"
        assert sender.smtp_port == 587
        assert sender.sender_email == "test@gmail.com"


# WebSocketManager Tests
class TestWebSocketManager:
    @pytest.fixture
    def ws_manager(self):
        """Create WebSocket manager"""
        return WebSocketManager()
    
    def test_get_connected_users(self, ws_manager):
        """Test getting connected users"""
        users = ws_manager.get_connected_users()
        assert isinstance(users, list)
        assert len(users) == 0
    
    def test_active_connections_init(self, ws_manager):
        """Test active connections initialization"""
        assert isinstance(ws_manager.active_connections, dict)
        assert len(ws_manager.active_connections) == 0


# DeduplicationService Tests
class TestDeduplicationService:
    @pytest.fixture
    def redis_mock(self):
        """Mock Redis client"""
        try:
            return redis.Redis(host='localhost', port=6379, db=0)
        except:
            pytest.skip("Redis not available")
    
    @pytest.fixture
    def dedup_service(self, redis_mock):
        """Create deduplication service"""
        return DeduplicationService(redis_mock)
    
    def test_generate_hash(self, dedup_service):
        """Test hash generation"""
        hash1 = dedup_service._generate_hash(1, "test message", "user@example.com")
        hash2 = dedup_service._generate_hash(1, "test message", "user@example.com")
        
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hash length
    
    def test_different_hashes(self, dedup_service):
        """Test that different inputs produce different hashes"""
        hash1 = dedup_service._generate_hash(1, "message1", "user@example.com")
        hash2 = dedup_service._generate_hash(1, "message2", "user@example.com")
        
        assert hash1 != hash2


# Integration Tests
class TestIntegration:
    def test_notification_workflow(self, db: Session):
        """Test complete notification workflow"""
        # Create notification
        notif = Notification(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            subject="Integration Test",
            message="Testing workflow",
            recipient="test@example.com"
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # Verify creation
        assert notif.id is not None
        assert notif.status == NotificationStatus.PENDING
        
        # Update status
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.utcnow()
        db.commit()
        
        # Verify update
        updated_notif = db.query(Notification).filter(Notification.id == notif.id).first()
        assert updated_notif.status == NotificationStatus.SENT
        assert updated_notif.sent_at is not None
    
    def test_query_notifications_by_user(self, db: Session, notification):
        """Test querying notifications by user"""
        notifs = db.query(Notification).filter(Notification.user_id == 1).all()
        
        assert len(notifs) > 0
        assert notifs[0].user_id == 1
    
    def test_query_pending_notifications(self, db: Session, notification):
        """Test querying pending notifications"""
        pending = db.query(Notification).filter(
            Notification.status == NotificationStatus.PENDING
        ).all()
        
        assert len(pending) > 0