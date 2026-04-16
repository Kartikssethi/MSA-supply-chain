from sqlalchemy import Column, String, DateTime
from datetime import datetime
import uuid
from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, index=True)