from pydantic import BaseModel

class ShipmentCreate(BaseModel):
    origin: str
    destination: str

class ShipmentResponse(BaseModel):
    id: str
    origin: str
    destination: str
    status: str

    class Config:
        from_attributes = True