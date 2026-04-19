from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api.routes import router
from app.kafka.producer import start_producer, stop_producer

app = FastAPI(title="Shipment Service")

# ✅ CORS (VERY IMPORTANT for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create DB tables
Base.metadata.create_all(bind=engine)

# ✅ Register routes
app.include_router(router)


# ✅ Startup event
@app.on_event("startup")
async def startup():
    await start_producer()


# ✅ Shutdown event
@app.on_event("shutdown")
async def shutdown():
    await stop_producer()