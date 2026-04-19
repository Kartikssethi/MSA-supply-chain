from fastapi import APIRouter, Depends, Header, Body, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.shipment import ShipmentCreate, ShipmentResponse
from app.services.shipment_service import create_shipment, get_all_shipments
from app.kafka.producer import send_event
from app.models.shipment import Shipment
from app.schemas.shipment import AssignDriverRequest
import requests

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(x_user: str = Header(None)):
    return x_user

@router.post("/shipments", response_model=ShipmentResponse)
async def create(shipment: ShipmentCreate, db: Session = Depends(get_db)):
    
    user_id = shipment.user_id

    new_shipment = create_shipment(
        db, 
        shipment.origin, 
        shipment.destination, 
        shipment.name,
        shipment.user_id,
        shipment.origin_lat,
        shipment.origin_long,
        shipment.destination_lat,
        shipment.destination_long
        )

    # Kafka event
    # await send_event("shipment.created", {
    #     "shipment_id": new_shipment.id,
    #     "origin": new_shipment.origin,
    #     "destination": new_shipment.destination
    # })

    return new_shipment


@router.get("/shipments", response_model=list[ShipmentResponse])
def get_all(user_id:str, db: Session = Depends(get_db)):
    shipments = get_all_shipments(db, user_id)

    result = []

    for s in shipments:
        driver_name = get_driver_name(s.driver_id) if s.driver_id else None

        result.append({
            "id": s.id,
            "origin": s.origin,
            "destination": s.destination,
            "origin_lat": s.origin_lat,
            "origin_long": s.origin_long,
            "destination_lat": s.destination_lat,
            "destination_long": s.destination_long,
            "status": s.status,
            "name": s.name,
            "driver_id": s.driver_id,
            "driver_name": driver_name,
            "user_id": s.user_id,
            "created_at": s.created_at
        })
    return result


@router.put("/shipments/{shipment_id}/assign-driver")
async def assign_driver(
    shipment_id: str,
    request: AssignDriverRequest,
    db: Session = Depends(get_db)):
    
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment.driver_id = request.driver_id
    shipment.status = "assigned"

    db.commit()
    db.refresh(shipment)

    return {
        "message": "Driver assigned successfully",
        "shipment_id": shipment_id,
        "driver": request.driver_name
    }

def get_driver_name(driver_id: str):
    try:
        res = requests.get("http://localhost:8002/fleet/drivers")
        drivers = res.json()

        for d in drivers:
            if d["id"] == driver_id:
                return d["name"]
    except:
        return None
    return None