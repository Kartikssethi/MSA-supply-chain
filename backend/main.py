#!/usr/bin/env python3
"""
Fleet Management Backend API
Main entry point for the Python backend server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Fleet Management API",
    description="Backend API for fleet management system",
    version="1.0.0"
)

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fleet Management API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Fleet Management API"
    }


@app.get("/api/vehicles")
async def get_vehicles():
    """Get all vehicles"""
    return {
        "vehicles": [],
        "total": 0
    }


@app.get("/api/drivers")
async def get_drivers():
    """Get all drivers"""
    return {
        "drivers": [],
        "total": 0
    }


@app.get("/api/trips")
async def get_trips():
    """Get all trips"""
    return {
        "trips": [],
        "total": 0
    }


@app.get("/api/tracking")
async def get_tracking():
    """Get vehicle tracking data"""
    return {
        "locations": [],
        "total": 0
    }


@app.get("/api/maintenance")
async def get_maintenance():
    """Get maintenance records"""
    return {
        "records": [],
        "total": 0
    }


@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get dashboard overview data"""
    return {
        "total_vehicles": 0,
        "total_drivers": 0,
        "active_trips": 0,
        "maintenance_due": 0
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


def main():
    """Main entry point"""
    print("Starting Fleet Management Backend API...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
