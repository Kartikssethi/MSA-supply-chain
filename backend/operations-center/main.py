from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.operations import router as operations_router

load_dotenv()

app = FastAPI(title="Operations Center Service")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(operations_router, prefix="/operations", tags=["Operations"])

@app.get("/")
def read_root():
    return {"status": "Operations Center Service is up and running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
