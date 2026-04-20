from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import httpx
import os
import asyncio
from pydantic import BaseModel
from app.services.database import supabase

router = APIRouter()

# Service URLs from environment variables
FLEET_SERVICE_URL = os.getenv("FLEET_SERVICE_URL", "http://fleet-service:8002")
SHIPMENT_SERVICE_URL = os.getenv("SHIPMENT_SERVICE_URL", "http://shipment-service:8000")
TELEMETRY_SERVICE_URL = os.getenv("TELEMETRY_SERVICE_URL", "http://telemetry-service:8004")
MAINTENANCE_SERVICE_URL = os.getenv("MAINTENANCE_SERVICE_URL", "http://maintenance-service:8003")

class KPISnapshot(BaseModel):
    onTimeRate: float
    activeTrips: int
    exceptionsOpen: int
    avgDelayMinutes: int
    utilizationRate: float

class Alert(BaseModel):
    id: str
    tripId: str
    vehicleId: str
    severity: str
    type: str
    status: str
    message: str
    etaImpactMinutes: int
    createdAt: str

# --- Operations Snapshot ---

@router.get("/snapshot", response_model=dict)
async def get_snapshot():
    """
    Aggregates KPIs from multiple services.
    """
    async with httpx.AsyncClient() as client:
        try:
            # 1. Get Shipments for Active Trips and On-Time stats
            # Note: shipment-service needs user_id, we might need to pass it or use a system user
            shipments_res = await client.get(f"{SHIPMENT_SERVICE_URL}/shipments?user_id=system", timeout=5.0)
            shipments = shipments_res.json() if shipments_res.status_code == 200 else []

            # 2. Get Fleet stats for Utilization
            vehicles_res = await client.get(f"{FLEET_SERVICE_URL}/fleet/vehicles", timeout=5.0)
            vehicles = vehicles_res.json() if vehicles_res.status_code == 200 else []

            # 3. Get Exceptions (from our own Supabase table or telemetry)
            # For now, let's try to fetch from 'operational_exceptions' table in Supabase
            exceptions_open = 0
            avg_delay = 0
            if supabase:
                exc_res = supabase.table("operational_exceptions").select("*").eq("status", "Open").execute()
                exceptions_open = len(exc_res.data) if exc_res.data else 0
                
                all_exc_res = supabase.table("operational_exceptions").select("eta_impact_minutes").execute()
                if all_exc_res.data:
                    impacts = [e["eta_impact_minutes"] for e in all_exc_res.data]
                    avg_delay = sum(impacts) // len(impacts) if impacts else 0

            # 4. Get active simulations from telemetry-service
            sim_count = 0
            try:
                sim_res = await client.get(f"{TELEMETRY_SERVICE_URL}/simulate/active", timeout=2.0)
                if sim_res.status_code == 200:
                    sim_count = sim_res.json().get("count", 0)
            except Exception as e:
                logger.error(f"Failed to fetch active simulations: {e}")

            # Calculations
            active_trips_real = len([s for s in shipments if s.get("status") == "in_transit"])
            active_trips = active_trips_real + sim_count
            total_vehicles = len(vehicles)
            vehicles_in_use = len([v for v in vehicles if v.get("status") == "In Use"])
            utilization = (vehicles_in_use / total_vehicles * 100) if total_vehicles > 0 else 0
            
            # Mock On-Time Rate for now or calculate from shipment history
            on_time_rate = 94.5 

            # Get real alerts first
            alerts = await get_alerts()

            return {
                "kpis": {
                    "onTimeRate": on_time_rate,
                    "activeTrips": active_trips,
                    "exceptionsOpen": exceptions_open,
                    "avgDelayMinutes": avg_delay,
                    "utilizationRate": round(utilization, 1)
                },
                "alerts": alerts
            }
        except Exception as e:
            # Fallback for development if services are down
            return {
                "kpis": {
                    "onTimeRate": 0,
                    "activeTrips": 0,
                    "exceptionsOpen": 0,
                    "avgDelayMinutes": 0,
                    "utilizationRate": 0
                },
                "alerts": [],
                "error": str(e)
            }

@router.get("/alerts", response_model=List[dict])
async def get_alerts():
    if not supabase:
        return []
    res = supabase.table("operational_exceptions").select("*").order("created_at", desc=True).execute()
    # Map database fields to frontend fields
    return [{
        "id": r["id"],
        "tripId": r["trip_id"],
        "vehicleId": r["vehicle_id"],
        "severity": r["severity"],
        "type": r["exception_type"],
        "status": r["status"],
        "message": r["message"],
        "etaImpactMinutes": r["eta_impact_minutes"],
        "createdAt": r["created_at"]
    } for r in res.data] if res.data else []

@router.patch("/alerts/{alert_id}")
async def update_alert_status(alert_id: str, payload: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    res = supabase.table("operational_exceptions").update({"status": status}).eq("id", alert_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return res.data[0]

# --- Dispatch Board ---

@router.get("/dispatch")
async def get_dispatch_board():
    async with httpx.AsyncClient() as client:
        # Fetch data from shipment-service and fleet-service in parallel
        shipments_task = client.get(f"{SHIPMENT_SERVICE_URL}/shipments?user_id=system")
        drivers_task = client.get(f"{FLEET_SERVICE_URL}/fleet/drivers")
        vehicles_task = client.get(f"{FLEET_SERVICE_URL}/fleet/vehicles")
        
        results = await asyncio.gather(shipments_task, drivers_task, vehicles_task, return_exceptions=True)
        
        shipments = results[0].json() if not isinstance(results[0], Exception) and results[0].status_code == 200 else []
        drivers = results[1].json() if not isinstance(results[1], Exception) and results[1].status_code == 200 else []
        vehicles = results[2].json() if not isinstance(results[2], Exception) and results[2].status_code == 200 else []
        
        return {
            "trips": [s for s in shipments if s.get("status") == "pending"],
            "drivers": [d for d in drivers if d.get("status") == "ACTIVE" and not d.get("assigned_vehicle_plate")],
            "vehicles": [v for v in vehicles if v.get("status") == "Available"]
        }

@router.post("/assign")
async def assign_trip(payload: dict):
    """
    Orchestrates trip assignment:
    1. Assign driver to vehicle in fleet-service.
    2. Update shipment with driver/vehicle info and status.
    """
    trip_id = payload.get("tripId")
    driver_id = payload.get("driverId")
    vehicle_id = payload.get("vehicleId")
    
    if not all([trip_id, driver_id, vehicle_id]):
        raise HTTPException(status_code=400, detail="Missing assignment details")

    async with httpx.AsyncClient() as client:
        # 1. Assign in Fleet Service
        fleet_res = await client.post(f"{FLEET_SERVICE_URL}/fleet/vehicles/{vehicle_id}/assign/{driver_id}")
        if fleet_res.status_code != 200:
            raise HTTPException(status_code=fleet_res.status_code, detail=f"Fleet Service Error: {fleet_res.text}")
        
        # 2. Update Shipment Service
        shipment_res = await client.put(
            f"{SHIPMENT_SERVICE_URL}/shipments/{trip_id}/assign-driver",
            json={"driver_id": driver_id, "driver_name": payload.get("driverName", "Assigned Driver")}
        )
        if shipment_res.status_code != 200:
            # Note: We might want to rollback fleet assignment here if this fails
            raise HTTPException(status_code=shipment_res.status_code, detail=f"Shipment Service Error: {shipment_res.text}")
            
        return {"message": "Assignment successful", "status": "completed"}

# --- Audit Trail ---

@router.get("/audit-trail")
async def get_audit_trail():
    if not supabase:
        return []
    res = supabase.table("audit_logs").select("*").order("timestamp", desc=True).limit(100).execute()
    if not res.data:
        return []
        
    return [{
        "id": r["id"],
        "actor": r["actor"],
        "actorRole": r.get("actor_role") or r.get("actorRole"),
        "action": r["action"],
        "entityType": r.get("entity_type") or r.get("entityType"),
        "entityId": r.get("entity_id") or r.get("entityId"),
        "summary": r["summary"],
        "timestamp": r["timestamp"]
    } for r in res.data]
