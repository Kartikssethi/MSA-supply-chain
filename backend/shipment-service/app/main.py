from fastapi import FastAPI
from app.database import Base, engine
from app.api.routes import router
from app.kafka.producer import start_producer, stop_producer

app = FastAPI(title="Shipment Service")

Base.metadata.create_all(bind=engine)

app.include_router(router)

@app.on_event("startup")
async def startup():
    try:
        await start_producer()
    except Exception as e:
        print(f"Error starting Kafka producer: {e}")

@app.on_event("shutdown")
async def shutdown():
    await stop_producer()