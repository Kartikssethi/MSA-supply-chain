from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.maintenance import router as maintenance_router

app = FastAPI()

# CORS (important for React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maintenance_router)

@app.get("/")
def root():
    return {"message": "Maintenance Service Running"}