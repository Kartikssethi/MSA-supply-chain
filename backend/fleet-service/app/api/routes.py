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
from sqlalchemy.orm import selectinload, joinedload
from app.database import get_db
from app.models.fleet import Driver, Vehicle
from app.redis_client import distributed_lock

router = APIRouter()

# --- Pydantic Schemas ---
class DriverCreate(BaseModel):
    name: str
    license: str

class VehicleCreate(BaseModel):
    plate_number: str
    model: str
    v_type: str

class DriverOut(BaseModel):
    id: str
    name: str
    license: str
    status: str
    assigned_vehicle_plate: str | None = None

    class Config:
        from_attributes = True

class VehicleOut(BaseModel):
    id: str
    plate_number: str
    model: str
    v_type: str
    status: str
    current_driver_id: str | None = None
    current_driver_name: str | None = None

    class Config:
        from_attributes = True

# --- Vehicle Routes ---

@router.get("/vehicles", response_model=List[VehicleOut])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    # Optimized: Use joinedload to fetch driver data together with vehicle in one query
    result = await db.execute(
        select(Vehicle).options(joinedload(Vehicle.current_driver))
    )
    vehicles = result.unique().scalars().all()
    out = []
    for v in vehicles:
        out.append(VehicleOut(
            id=str(v.id),
            plate_number=v.plate_number,
            model=v.model,
            v_type=v.v_type,
            status=v.status,
            current_driver_id=str(v.current_driver_id) if v.current_driver_id else None,
            current_driver_name=v.current_driver.name if v.current_driver else None,
        ))
    return out

@router.post("/vehicles")
async def create_vehicle(data: VehicleCreate, db: AsyncSession = Depends(get_db)):
    try:
        vehicle = Vehicle(**data.model_dump())
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return VehicleOut(
            id=str(vehicle.id),
            plate_number=vehicle.plate_number,
            model=vehicle.model,
            v_type=vehicle.v_type,
            status=vehicle.status,
            current_driver_id=None,
            current_driver_name=None,
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle with plate {data.plate_number} already exists."
        )

@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await db.delete(vehicle)
    await db.commit()
    return {"message": "Vehicle deleted", "id": str(vehicle_id)}

# --- Driver Routes ---

@router.get("/drivers", response_model=List[DriverOut])
async def list_drivers(db: AsyncSession = Depends(get_db)):
    # Optimized: Use joinedload to fetch assigned vehicle data together with driver
    result = await db.execute(
        select(Driver).options(joinedload(Driver.current_vehicle))
    )
    drivers = result.unique().scalars().all()
    out = []
    for d in drivers:
        out.append(DriverOut(
            id=str(d.id),
            name=d.name,
            license=d.license,
            status=d.status,
            assigned_vehicle_plate=d.current_vehicle.plate_number if d.current_vehicle else None,
        ))
    return out

@router.post("/drivers")
async def create_driver(data: DriverCreate, db: AsyncSession = Depends(get_db)):
    try:
        driver = Driver(**data.model_dump(), status = "ACTIVE")
        db.add(driver)
        await db.commit()
        await db.refresh(driver)
        return DriverOut(
            id=str(driver.id),
            name=driver.name,
            license=driver.license,
            status=driver.status,
            assigned_vehicle_plate=None,
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Driver with license {data.license} already exists."
        )

@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    # Unassign from any vehicle first
    veh_result = await db.execute(select(Vehicle).where(Vehicle.current_driver_id == driver_id))
    veh = veh_result.scalar_one_or_none()
    if veh:
        veh.current_driver_id = None
        veh.status = "Available"
    await db.delete(driver)
    await db.commit()
    return {"message": "Driver deleted", "id": str(driver_id)}

# --- Assignment Routes ---

@router.post("/vehicles/{vehicle_id}/assign/{driver_id}")
async def assign_driver_to_vehicle(
    vehicle_id: UUID, 
    driver_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    """
    Assigns a driver to a vehicle using distributed locks for concurrency control.
    """
    try:
        async with distributed_lock(f"vehicle:{vehicle_id}"):
            async with distributed_lock(f"driver:{driver_id}"):
                
                vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
                vehicle = vehicle_result.scalar_one_or_none()
                
                driver_result = await db.execute(select(Driver).where(Driver.id == driver_id))
                driver = driver_result.scalar_one_or_none()
                
                if not vehicle:
                    raise HTTPException(status_code=404, detail="Vehicle not found")
                if not driver:
                    raise HTTPException(status_code=404, detail="Driver not found")
                
                if vehicle.current_driver_id:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Vehicle already assigned to driver {vehicle.current_driver_id}"
                    )
                
                existing_assignment = await db.execute(select(Vehicle).where(Vehicle.current_driver_id == driver_id))
                if existing_assignment.scalar_one_or_none():
                    raise HTTPException(
                        status_code=400, 
                        detail="Driver is already assigned to another vehicle"
                    )

                vehicle.current_driver_id = driver_id
                vehicle.status = "In Use"
                
                await db.commit()
                
                return {
                    "message": "Driver successfully assigned to vehicle ✅",
                    "vehicle_id": str(vehicle_id),
                    "driver_id": str(driver_id),
                    "vehicle_plate": vehicle.plate_number,
                    "driver_name": driver.name,
                }

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED, 
            detail=str(e)
        )

@router.post("/vehicles/{vehicle_id}/unassign")
async def unassign_driver_from_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Removes the current driver assignment from a vehicle."""
    try:
        async with distributed_lock(f"vehicle:{vehicle_id}"):
            vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
            vehicle = vehicle_result.scalar_one_or_none()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")
            if not vehicle.current_driver_id:
                raise HTTPException(status_code=400, detail="Vehicle has no driver assigned")
            
            vehicle.current_driver_id = None
            vehicle.status = "Available"
            await db.commit()
            
            return {"message": "Driver unassigned from vehicle", "vehicle_id": str(vehicle_id)}
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=str(e))