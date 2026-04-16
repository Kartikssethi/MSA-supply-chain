from sqlalchemy.orm import Session
from app.models.shipment import Shipment



def create_shipment(db: Session, origin: str, destination: str, user_id: str):
    shipment = Shipment(origin=origin, destination=destination, user_id=user_id)
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

def get_all_shipments(db: Session, user_id: str):
    return db.query(Shipment).filter(Shipment.user_id == user_id).all()