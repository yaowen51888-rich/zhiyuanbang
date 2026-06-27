"""学校查询：列表（筛选+分页）+ 详情（含历年分数线）。"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import SchoolDetail, SchoolInfo, SchoolScore
from app.models.enums import SubjectType
from app.schemas.common import ApiResponse, Page
from app.schemas.school import SchoolDetailOut, SchoolOut, SchoolYearScore

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("", response_model=ApiResponse[Page[SchoolOut]])
def list_schools(
    keyword: str | None = None,
    province: str | None = None,
    is_985: bool | None = None,
    is_211: bool | None = None,
    type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = select(SchoolInfo)
    if keyword:
        stmt = stmt.where(SchoolInfo.name.contains(keyword))
    if province:
        stmt = stmt.where(SchoolInfo.province == province)
    if is_985 is not None:
        stmt = stmt.where(SchoolInfo.is_985 == is_985)
    if is_211 is not None:
        stmt = stmt.where(SchoolInfo.is_211 == is_211)
    if type:
        stmt = stmt.where(SchoolInfo.type == type)

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return ApiResponse(data=Page(
        items=[SchoolOut.model_validate(r, from_attributes=True) for r in rows],
        total=total, page=page, page_size=page_size,
    ))


@router.get("/{school_id}", response_model=ApiResponse[SchoolDetailOut])
def get_school(school_id: int, session: Session = Depends(get_session)):
    info = session.get(SchoolInfo, school_id)
    if not info:
        raise HTTPException(status_code=404, detail="school not found")
    detail = session.get(SchoolDetail, school_id)
    scores = session.exec(
        select(SchoolScore)
        .where(SchoolScore.school_id == school_id)
        .order_by(SchoolScore.year.desc())
    ).all()
    return ApiResponse(data=SchoolDetailOut(
        **SchoolOut.model_validate(info, from_attributes=True).model_dump(),
        intro=detail.intro if detail else "",
        history_scores=[SchoolYearScore(year=s.year, score=s.score, rank=s.rank) for s in scores],
    ))
