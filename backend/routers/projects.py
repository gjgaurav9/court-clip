from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Project
from schemas import ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(name=data.name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _with_count(project)


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    return [_with_count(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _with_count(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    db.commit()
    db.refresh(project)
    return _with_count(project)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}


def _with_count(project: Project) -> dict:
    return {
        **{c.name: getattr(project, c.name) for c in Project.__table__.columns},
        "annotation_count": len(project.annotations),
    }
