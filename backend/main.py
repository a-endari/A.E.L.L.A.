from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.services.audio import cleanup_unused_audio
from app.services.db import init_db
from app.routers import lookup, anki, lists, obsidian

app = FastAPI(title="Universal Language App API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static/audio", exist_ok=True)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup_event():
    init_db()
    # Initial cleanup (preserve nothing extra)
    cleanup_unused_audio()

@app.get("/")
async def root():
    return {"message": "Universal Language App API is running!"}

# Include Routers
app.include_router(lookup.router, prefix="/api", tags=["Lookup"])
app.include_router(anki.router, prefix="/api/anki", tags=["Anki"])
app.include_router(obsidian.router, prefix="/api/obsidian", tags=["Obsidian"])
app.include_router(lists.router, prefix="/api/lists", tags=["Lists"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)