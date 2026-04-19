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
def get_all(user_id: str, db: Session = Depends(get_db)):
    shipments = get_all_shipments(db, user_id)

    # Optimization: Fetch all drivers once from fleet-service to avoid N+1 network calls
    driver_map = {}
    try:
        # Useinternal docker compose hostname "fleet-service"
        res = requests.get("http://fleet-service:8002/fleet/drivers", timeout=2)
        if res.status_code == 200:
            drivers_list = res.json()
            driver_map = {str(d["id"]): d["name"] for d in drivers_list}
    except Exception as e:
        print(f"Warning: Could not connect to fleet-service for names: {e}")

    result = []
    for s in shipments:
        driver_id_str = str(s.driver_id) if s.driver_id else None
        driver_name = driver_map.get(driver_id_str) if driver_id_str else None

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
            "driver_id": driver_id_str,
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
    
    try:
        shipment_id_clean = shipment_id.strip()
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id_clean).first()

        if not shipment:
            all_ids = [s.id for s in db.query(Shipment).all()]
            raise HTTPException(status_code=404, detail=f"Shipment not found for ID: '{shipment_id_clean}'. Available IDs: {all_ids}")

        shipment.driver_id = request.driver_id
        shipment.status = "assigned"

        db.commit()
        db.refresh(shipment)

        return {
            "message": "Driver assigned successfully",
            "shipment_id": shipment_id,
            "driver": request.driver_name
        }
    except HTTPException as e:
        # Re-raise the HTTP exception so it propagates correctly (e.g. 404)
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"DEBUG ERROR: {str(e)}")


@router.get("/debug-shipments")
def debug_shipments(db: Session = Depends(get_db)):
    return db.query(Shipment).all()