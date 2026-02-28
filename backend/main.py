import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import projects, annotations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CourtClip API", version="1.0.0")

# CORS — allow frontend origins
origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(annotations.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
