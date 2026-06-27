"""专业查询。"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import MajorInfo, MajorScore
from app.schemas.common import ApiResponse, Page
from app.schemas.major import MajorOut
from app.schemas.school import SchoolYearScore

router = APIRouter(prefix="/majors", tags=["majors"])


@router.get("", response_model=ApiResponse[Page[MajorOut]])
def list_majors(
    keyword: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = select(MajorInfo)
    if keyword:
        stmt = stmt.where(MajorInfo.name.contains(keyword))
    if category:
        stmt = stmt.where(MajorInfo.category == category)
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return ApiResponse(data=Page(
        items=[MajorOut.model_validate(r, from_attributes=True) for r in rows],
        total=total, page=page, page_size=page_size,
    ))


@router.get("/{major_id}/scores", response_model=ApiResponse[list[SchoolYearScore]])
def major_scores(major_id: int, session: Session = Depends(get_session)):
    if not session.get(MajorInfo, major_id):
        raise HTTPException(status_code=404, detail="major not found")
    rows = session.exec(
        select(MajorScore).where(MajorScore.major_id == major_id).order_by(MajorScore.year.desc())
    ).all()
    return ApiResponse(data=[
        SchoolYearScore(year=r.year, score=r.min_score or 0, rank=r.min_rank or 0) for r in rows
    ])
