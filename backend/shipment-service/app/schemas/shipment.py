from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShipmentCreate(BaseModel):
    origin: str
    origin_lat: float
    origin_long: float
    destination: str
    destination_lat : float
    destination_long: float
    name: str
    user_id: str

class ShipmentResponse(BaseModel):
    id: str
    origin: str
    destination: str
    origin_lat: float
    origin_long: float
    destination_lat: float
    destination_long: float
    status: str
    name: str
    driver_id: str | None = None
    driver_name: str |None = None
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class AssignDriverRequest(BaseModel):
    driver_id: str
    driver_name: Optional[str] = None