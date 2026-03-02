from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Rally, Project
from schemas import RallyCreate, RallyUpdate, RallyOut

router = APIRouter(prefix="/api/projects/{project_id}/rallies", tags=["rallies"])


def _get_project(project_id: int, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=RallyOut)
def create_or_update_rally(project_id: int, data: RallyCreate, db: Session = Depends(get_db)):
    _get_project(project_id, db)
    existing = (
        db.query(Rally)
        .filter(Rally.project_id == project_id, Rally.rally_number == data.rally_number)
        .first()
    )
    if existing:
        for key, val in data.model_dump(exclude_unset=True).items():
            if key != "rally_number":
                setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return existing

    rally = Rally(project_id=project_id, **data.model_dump())
    db.add(rally)
    db.commit()
    db.refresh(rally)
    return rally


@router.get("", response_model=list[RallyOut])
def list_rallies(project_id: int, db: Session = Depends(get_db)):
    _get_project(project_id, db)
    return (
        db.query(Rally)
        .filter(Rally.project_id == project_id)
        .order_by(Rally.rally_number)
        .all()
    )


@router.put("/{rally_number}", response_model=RallyOut)
def update_rally(project_id: int, rally_number: int, data: RallyUpdate, db: Session = Depends(get_db)):
    rally = (
        db.query(Rally)
        .filter(Rally.project_id == project_id, Rally.rally_number == rally_number)
        .first()
    )
    if not rally:
        raise HTTPException(status_code=404, detail="Rally not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(rally, key, val)
    db.commit()
    db.refresh(rally)
    return rally
