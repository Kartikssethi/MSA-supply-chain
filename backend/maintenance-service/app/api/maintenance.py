from fastapi import APIRouter, HTTPException
from app.services.database import supabase
from app.schemas.maintenance import MaintenanceCreate
import httpx
import os

router = APIRouter()

FLEET_SERVICE_URL = os.getenv("FLEET_SERVICE_URL")


# ================================
# 🔹 GET ALL MAINTENANCE RECORDS
# ================================
@router.get("/maintenance")
def get_maintenance():
    try:
        res = supabase.table("maintenance").select("*").execute()
        records = res.data

        # 🔹 Fetch vehicles for mapping vehicle number
        vehicle_map = {}
        try:
            r = httpx.get(f"{FLEET_SERVICE_URL}/fleet/vehicles")
            if r.status_code == 200:
                vehicles = r.json()
                vehicle_map = {v["id"]: v["plate_number"] for v in vehicles}
        except:
            pass  # fallback if fleet service is down

        # attach vehicleNumber
        for r in records:
            r["vehicleNumber"] = vehicle_map.get(r["vehicleid"], "Unknown")

        return records

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# 🔹 CREATE MAINTENANCE RECORD
# ================================
@router.post("/maintenance")
def create_maintenance(data: MaintenanceCreate):
    try:
        insert_data = {
            "vehicleid": data.vehicleid,
            "date": data.date,
            "description": data.description,
            "cost": data.cost,
            "performed_by": data.performed_by,
            "role": data.role
        }

        res = supabase.table("maintenance").insert(insert_data).execute()

        print("INSERT RESPONSE:", res)

        if not res.data:
            raise Exception(f"Insert failed: {res}")

        return res.data[0]

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# 🔹 GET VEHICLES (proxy)
# ================================
@router.get("/vehicles")
def get_vehicles():
    try:
        res = httpx.get(f"{FLEET_SERVICE_URL}/fleet/vehicles")
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))