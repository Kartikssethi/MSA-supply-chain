from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.shipment import ShipmentCreate, ShipmentResponse
from app.services.shipment_service import create_shipment, get_all_shipments
from app.kafka.producer import send_event

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

    new_shipment = create_shipment(db, shipment.origin, shipment.destination, user_id)

    # Kafka event
    # await send_event("shipment.created", {
    #     "shipment_id": new_shipment.id,
    #     "origin": new_shipment.origin,
    #     "destination": new_shipment.destination
    # })

    return new_shipment


@router.get("/shipments", response_model=list[ShipmentResponse])
def get_all(user_id:str, db: Session = Depends(get_db)):
    return get_all_shipments(db, user_id)