import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Annotation, Project
from schemas import AnnotationCreate, AnnotationUpdate, AnnotationOut

router = APIRouter(prefix="/api/projects/{project_id}/annotations", tags=["annotations"])


def _get_project(project_id: int, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=AnnotationOut)
def create_annotation(project_id: int, data: AnnotationCreate, db: Session = Depends(get_db)):
    _get_project(project_id, db)
    annotation = Annotation(project_id=project_id, **data.model_dump())
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.get("", response_model=list[AnnotationOut])
def list_annotations(project_id: int, db: Session = Depends(get_db)):
    _get_project(project_id, db)
    return (
        db.query(Annotation)
        .filter(Annotation.project_id == project_id)
        .order_by(Annotation.frame_start)
        .all()
    )


@router.put("/{annotation_id}", response_model=AnnotationOut)
def update_annotation(project_id: int, annotation_id: int, data: AnnotationUpdate, db: Session = Depends(get_db)):
    ann = (
        db.query(Annotation)
        .filter(Annotation.id == annotation_id, Annotation.project_id == project_id)
        .first()
    )
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(ann, key, val)
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/{annotation_id}")
def delete_annotation(project_id: int, annotation_id: int, db: Session = Depends(get_db)):
    ann = (
        db.query(Annotation)
        .filter(Annotation.id == annotation_id, Annotation.project_id == project_id)
        .first()
    )
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(ann)
    db.commit()
    return {"ok": True}


@router.get("/export")
def export_annotations(
    project_id: int,
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
):
    project = _get_project(project_id, db)
    annotations = (
        db.query(Annotation)
        .filter(Annotation.project_id == project_id)
        .order_by(Annotation.frame_start)
        .all()
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "video_name", "rally_number", "shot_number", "player_id",
            "shot_type", "backhand", "around_head", "hit_area",
            "player_area", "opponent_area",
            "frame_start", "frame_end", "duration_sec",
        ])
        for a in annotations:
            writer.writerow([
                project.video_filename or "",
                a.rally_number, a.shot_number, a.player_id,
                a.shot_type, int(a.backhand), int(a.around_head),
                a.hit_area if a.hit_area is not None else "",
                a.player_area if a.player_area is not None else "",
                a.opponent_area if a.opponent_area is not None else "",
                a.frame_start, a.frame_end, a.duration_sec,
            ])
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=annotations_{project_id}.csv"},
        )

    # JSON
    data = [
        {
            "video_name": project.video_filename or "",
            "rally_number": a.rally_number,
            "shot_number": a.shot_number,
            "player_id": a.player_id,
            "shot_type": a.shot_type,
            "backhand": a.backhand,
            "around_head": a.around_head,
            "hit_area": a.hit_area,
            "player_area": a.player_area,
            "opponent_area": a.opponent_area,
            "frame_start": a.frame_start,
            "frame_end": a.frame_end,
            "duration_sec": a.duration_sec,
        }
        for a in annotations
    ]
    import json
    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=annotations_{project_id}.json"},
    )
