from sqlalchemy.orm import Session
from datetime import datetime
import math
from app.models.shipment import Shipment

# Default Rates
CF_FUEL_PER_KM = 0.5
CZ_LABOR_PER_KM = 0.3

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in km between two lat/long points."""
    if None in (lat1, lon1, lat2, lon2):
        return 0.0
    
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def create_shipment(db: Session, origin: str, destination: str,  name:str, user_id: str,
                    origin_lat:float, origin_long: float, destination_lat:float,
                    destination_long:float, shipment_date: datetime = None):
    
    # Calculate price
    distance = calculate_haversine_distance(origin_lat, origin_long, destination_lat, destination_long)
    estimated_price = distance * (CF_FUEL_PER_KM + CZ_LABOR_PER_KM)
    
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
        shipment_date=shipment_date,
        estimated_price=round(estimated_price, 2)
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

def get_all_shipments(db: Session, user_id: str):
    return db.query(Shipment).filter(Shipment.user_id == user_id).all()