from pydantic import BaseModel
from datetime import datetime

class ShipmentCreate(BaseModel):
    origin: str
    destination: str
    user_id: str

class ShipmentResponse(BaseModel):
    id: str
    origin: str
    destination: str
    status: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True