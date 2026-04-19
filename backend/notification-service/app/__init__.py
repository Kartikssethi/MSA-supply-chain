from app.database import init_db, get_db, SessionLocal
from app.utils import setup_logger

# Initialize logger
logger = setup_logger("notification_service")

__all__ = [
    "init_db",
    "get_db",
    "SessionLocal",
    "logger",
]