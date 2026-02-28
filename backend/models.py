from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    video_filename = Column(String, nullable=True)
    video_fps = Column(Float, nullable=True)
    total_frames = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    rally_number = Column(Integer, nullable=False)
    shot_number = Column(Integer, nullable=False)
    player_id = Column(String, nullable=False)
    shot_type = Column(String, nullable=False)
    backhand = Column(Boolean, default=False)
    around_head = Column(Boolean, default=False)
    hit_area = Column(Integer, nullable=True)
    frame_start = Column(Integer, nullable=False)
    frame_end = Column(Integer, nullable=False)
    duration_sec = Column(Float, nullable=False)

    project = relationship("Project", back_populates="annotations")
