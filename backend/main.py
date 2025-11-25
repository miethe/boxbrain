from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes
from .database import engine, Base
from . import models_db  # Import models to register them with Base
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

app = FastAPI(title="GitKB API", version="0.1.0")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(routes.router, prefix="/api")

# Ensure assets directory exists
ASSETS_DIR = Path("assets")
ASSETS_DIR.mkdir(exist_ok=True)

# Mount static files for assets
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
