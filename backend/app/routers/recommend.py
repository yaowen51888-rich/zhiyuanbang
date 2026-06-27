"""志愿推荐：分数→位次→候选学校→分档+概率。"""
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.errors import ERR_NO_CANDIDATE, ERR_NO_RANK_DATA, ERR_SCORE_OUT_OF_RANGE
from app.models import ScoreRank, SchoolInfo, SchoolScore
from app.schemas.common import ApiResponse
from app.schemas.recommend import RecommendItemOut, RecommendRequest
from app.services.recommendation import recommend

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("", response_model=ApiResponse[list[RecommendItemOut]])
def recommend_schools(req: RecommendRequest, session: Session = Depends(get_session)):
    # 1. 分数→位次（取该省科类最新年份）
    rank_rows = session.exec(
        select(ScoreRank).where(
            ScoreRank.province_id == req.province_id,
            ScoreRank.subject_type == req.subject_type,
        )
    ).all()
    if not rank_rows:
        raise ERR_NO_RANK_DATA
    latest_year = max(r.year for r in rank_rows)
    year_rows = [r for r in rank_rows if r.year == latest_year]
    exact = next((r for r in year_rows if r.score == req.score), None)
    if exact is None:
        below = [r for r in year_rows if r.score < req.score]
        exact = max(below, key=lambda r: r.score) if below else None
    if exact is None:
        raise ERR_SCORE_OUT_OF_RANGE
    candidate_rank = exact.rank

    # 2. 候选学校 + 历年录取位次
    score_rows = session.exec(
        select(SchoolScore).where(
            SchoolScore.province_id == req.province_id,
            SchoolScore.subject_type == req.subject_type,
        )
    ).all()
    # 聚合 school_id → [历年 rank]
    hist: dict[int, list[int]] = {}
    for s in score_rows:
        hist.setdefault(s.school_id, []).append(s.rank)
    school_history = [(sid, ranks) for sid, ranks in hist.items()]

    # 3. 算法分档（直接传递 settings，不再构造 thresholds 字典）
    items = recommend(candidate_rank, school_history, settings)
    if not items:
        raise ERR_NO_CANDIDATE

    # 4. 补校名输出
    id_to_name = {s.school_id: s.name for s in session.exec(select(SchoolInfo)).all()}
    return ApiResponse(data=[
        RecommendItemOut(
            school_id=it.school_id, school_name=id_to_name.get(it.school_id, ""),
            tier=it.tier.value, probability=it.probability,
            rank_mean=it.rank_mean, rank_min=it.rank_min, rank_max=it.rank_max,
        ) for it in items
    ])
