"""
app/models/fleet.py — Driver and Vehicle definitions.
"""
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    license = Column(String, unique=True, nullable=False)
    status = Column(String, default=True)
    
    # Relationship with Vehicle
    current_vehicle = relationship("Vehicle", back_populates="current_driver", uselist=False)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String, unique=True, nullable=False)
    model = Column(String, nullable=False)
    v_type = Column(String, nullable=False)  # 'Truck', 'Van', etc.
    status = Column(String, default="Available")  # 'Available', 'In Use', 'Maintenance'

    # Assignment FK
    current_driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    current_driver = relationship("Driver", back_populates="current_vehicle")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
