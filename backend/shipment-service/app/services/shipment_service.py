from sqlalchemy.orm import Session
from app.models.shipment import Shipment

def create_shipment(db: Session, origin: str, destination: str):
    shipment = Shipment(origin=origin, destination=destination)
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

def get_all_shipments(db: Session):
    return db.query(Shipment).all()