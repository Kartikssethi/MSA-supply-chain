from pydantic import BaseModel
from typing import Optional

class MaintenanceCreate(BaseModel):
    vehicleid: str
    date: str
    description: str
    cost: float
    performed_by: str
    role: str


class MaintenanceResponse(BaseModel):
    id: str
    vehicleid: str
    vehicleNumber: Optional[str]
    date: str
    description: str
    cost: float
    performed_by: str