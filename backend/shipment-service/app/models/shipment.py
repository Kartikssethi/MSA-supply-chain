from sqlalchemy import Column, String, DateTime, Float
from datetime import datetime
import uuid
from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    origin_lat = Column(Float, nullable=True)
    origin_long = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_long = Column(Float, nullable=True)
    

    driver_id = Column(String, nullable=True)

    name = Column(String, nullable=False, default="none")
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    shipment_date = Column(DateTime, nullable=True)
    user_id = Column(String, nullable=False)
