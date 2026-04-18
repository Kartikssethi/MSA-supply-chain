from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShipmentCreate(BaseModel):
    origin: str
    destination: str
    name: str
    driver: Optional[str] = None
    user_id: str

class ShipmentResponse(BaseModel):
    id: str
    origin: str
    destination: str
    status: str
    name: str
    driver: str |None = None
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True