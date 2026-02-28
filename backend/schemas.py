from pydantic import BaseModel
from datetime import datetime


# --- Project schemas ---

class ProjectCreate(BaseModel):
    name: str


class ProjectUpdate(BaseModel):
    name: str | None = None
    video_filename: str | None = None
    video_fps: float | None = None
    total_frames: int | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    video_filename: str | None
    video_fps: float | None
    total_frames: int | None
    created_at: datetime
    updated_at: datetime
    annotation_count: int = 0

    model_config = {"from_attributes": True}


# --- Annotation schemas ---

class AnnotationCreate(BaseModel):
    rally_number: int
    shot_number: int
    player_id: str
    shot_type: str
    backhand: bool = False
    around_head: bool = False
    hit_area: int | None = None
    frame_start: int
    frame_end: int
    duration_sec: float


class AnnotationUpdate(BaseModel):
    rally_number: int | None = None
    shot_number: int | None = None
    player_id: str | None = None
    shot_type: str | None = None
    backhand: bool | None = None
    around_head: bool | None = None
    hit_area: int | None = None
    frame_start: int | None = None
    frame_end: int | None = None
    duration_sec: float | None = None


class AnnotationOut(BaseModel):
    id: int
    project_id: int
    rally_number: int
    shot_number: int
    player_id: str
    shot_type: str
    backhand: bool
    around_head: bool
    hit_area: int | None
    frame_start: int
    frame_end: int
    duration_sec: float

    model_config = {"from_attributes": True}
