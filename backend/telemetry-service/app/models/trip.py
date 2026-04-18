from sqlalchemy import Column, String, Float, DateTime, Integer
from datetime import datetime

from app.database import Base

class TripLocation(Base):
    __tablename__ = "telemetry_trip_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    driver_id = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=True) # speed in km/h or mph
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
