from sqlalchemy.orm import Session
from datetime import datetime
from app.models.shipment import Shipment



def create_shipment(db: Session, origin: str, destination: str,  name:str, user_id: str,
                    origin_lat:float, origin_long: float, destination_lat:float,
                    destination_long:float, shipment_date: datetime = None):
    shipment = Shipment(
        origin=origin, 
        destination=destination, 
        name=name, 
        driver_id=None, 
        origin_lat=origin_lat, 
        origin_long=origin_long, 
        destination_lat=destination_lat,
        destination_long=destination_long, 
        user_id=user_id,
        shipment_date=shipment_date
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

def get_all_shipments(db: Session, user_id: str):
    return db.query(Shipment).filter(Shipment.user_id == user_id).all()