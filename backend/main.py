import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import inspect, text

from database import engine, Base
from routers import projects, annotations, rallies

Base.metadata.create_all(bind=engine)

# Auto-migrate: add new columns if they don't exist yet
def _migrate():
    insp = inspect(engine)
    if insp.has_table("annotations"):
        existing = {c["name"] for c in insp.get_columns("annotations")}
        new_cols = {
            "player_area": "INTEGER",
            "opponent_area": "INTEGER",
        }
        with engine.begin() as conn:
            for col, typ in new_cols.items():
                if col not in existing:
                    conn.execute(text(f'ALTER TABLE annotations ADD COLUMN {col} {typ}'))

_migrate()

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
app.include_router(rallies.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
