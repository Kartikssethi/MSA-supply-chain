from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LocationPing(BaseModel):
    driver_id: str
    latitude: float
    longitude: float
    speed: Optional[float] = None
    timestamp: Optional[datetime] = None
