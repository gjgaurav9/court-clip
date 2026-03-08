import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from database import engine, Base, SessionLocal, DATABASE_URL
from routers import projects, annotations, rallies

logger = logging.getLogger(__name__)


def run_migrations():
    """Run Alembic migrations to head on startup."""
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
    command.upgrade(alembic_cfg, "head")


# Run Alembic migrations for PostgreSQL; fall back to create_all for SQLite dev mode
if DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)
else:
    try:
        run_migrations()
    except Exception as e:
        logger.warning("Alembic migration failed (%s), falling back to create_all", e)
        Base.metadata.create_all(bind=engine)

app = FastAPI(title="CourtClip API", version="1.0.0")

# CORS — allow frontend origins
origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,app://-").split(",")
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
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}
