from sqlalchemy import Column, String, Float, DateTime, Integer
from datetime import datetime

from app.database import Base

class TripLocation(Base):
    __tablename__ = "telemetry_trip_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    driver_id = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True) # Will use UUID in code
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String)
    actor_role = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    summary = Column(String)

class OperationalException(Base):
    __tablename__ = "operational_exceptions"
    id = Column(String, primary_key=True) # Will use UUID in code
    trip_id = Column(String)
    vehicle_id = Column(String)
    severity = Column(String)
    exception_type = Column(String)
    status = Column(String, default="Open")
    message = Column(String)
    eta_impact_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
