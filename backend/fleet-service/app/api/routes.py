"""
app/api/routes.py — CRUD for Drivers/Vehicles and the Locked Assignment Logic.
"""
from uuid import UUID
from typing import List
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.fleet import Driver, Vehicle
from app.redis_client import distributed_lock

router = APIRouter()

# --- Pydantic Schemas ---
class DriverCreate(BaseModel):
    name: str
    license_number: str

class VehicleCreate(BaseModel):
    plate_number: str
    model: str
    v_type: str

class AssignmentResponse(BaseModel):
    message: str
    vehicle_id: UUID
    driver_id: UUID

# --- Routes ---

@router.post("/drivers")
async def create_driver(data: DriverCreate, db: AsyncSession = Depends(get_db)):
    try:
        driver = Driver(**data.model_dump())
        db.add(driver)
        await db.commit()
        await db.refresh(driver)
        return driver
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Driver with license {data.license_number} already exists."
        )

@router.post("/vehicles")
async def create_vehicle(data: VehicleCreate, db: AsyncSession = Depends(get_db)):
    try:
        vehicle = Vehicle(**data.model_dump())
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle with plate {data.plate_number} already exists."
        )

@router.post("/vehicles/{vehicle_id}/assign/{driver_id}")
async def assign_driver_to_vehicle(
    vehicle_id: UUID, 
    driver_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    """
    Assigns a driver to a vehicle using distributed locks for concurrency control.
    """
    
    # 1. Acquire locks for both resources to prevent race conditions
    # We lock both to ensure no other request can touch either this vehicle OR this driver
    # during the update.
    try:
        async with distributed_lock(f"vehicle:{vehicle_id}"):
            async with distributed_lock(f"driver:{driver_id}"):
                
                # 2. Fetch current state inside the lock
                vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
                vehicle = vehicle_result.scalar_one_or_none()
                
                driver_result = await db.execute(select(Driver).where(Driver.id == driver_id))
                driver = driver_result.scalar_one_or_none()
                
                if not vehicle:
                    raise HTTPException(status_code=404, detail="Vehicle not found")
                if not driver:
                    raise HTTPException(status_code=404, detail="Driver not found")
                
                # 3. Validation Logic
                if vehicle.current_driver_id:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Vehicle already assigned to driver {vehicle.current_driver_id}"
                    )
                
                # Check if driver is already assigned to ANY vehicle
                existing_assignment = await db.execute(select(Vehicle).where(Vehicle.current_driver_id == driver_id))
                if existing_assignment.scalar_one_or_none():
                    raise HTTPException(
                        status_code=400, 
                        detail="Driver is already assigned to another vehicle"
                    )

                # 4. Perform the Assignment
                vehicle.current_driver_id = driver_id
                vehicle.status = "In Use"
                
                await db.commit()
                
                return {
                    "message": "Driver successfully assigned to vehicle ✅",
                    "vehicle_id": vehicle_id,
                    "driver_id": driver_id
                }

    except RuntimeError as e:
        # This happens if we fail to acquire the lock (timeout)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED, 
            detail=str(e)
        )
