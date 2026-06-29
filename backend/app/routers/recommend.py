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


def _approx_rank(score_rows: list, req_score: int) -> int | None:
    """无一分一段表时的降级估算：用该省录取线 (score, rank) 点集估考生位次。

    取「录取最低分 ≤ 考生分」中最高录取分对应的录取位次（位次上界，偏保守）；
    若考生分低于所有录取线，取录取分最低校的录取位次（最靠后）。
    ponytail: 由录取线反推位次，非真实一分一段表，精度有限但足以驱动分档。
    """
    eligible = [(s.score, s.rank) for s in score_rows if s.score <= req_score]
    if eligible:
        return max(eligible, key=lambda x: x[0])[1]
    return min(score_rows, key=lambda s: s.score).rank if score_rows else None


@router.post("", response_model=ApiResponse[list[RecommendItemOut]])
def recommend_schools(req: RecommendRequest, session: Session = Depends(get_session)):
    # 1. 候选学校录取线 + 历年位次（聚合 school_id → [历年 rank]）
    score_rows = session.exec(
        select(SchoolScore).where(
            SchoolScore.province_id == req.province_id,
            SchoolScore.subject_type == req.subject_type,
        )
    ).all()
    if not score_rows:
        raise ERR_NO_RANK_DATA
    hist: dict[int, list[int]] = {}
    for s in score_rows:
        hist.setdefault(s.school_id, []).append(s.rank)
    school_history = [(sid, ranks) for sid, ranks in hist.items()]

    # 2. 分数→位次：有精确一分一段表用之，否则用录取线点集降级估算
    rank_rows = session.exec(
        select(ScoreRank).where(
            ScoreRank.province_id == req.province_id,
            ScoreRank.subject_type == req.subject_type,
        )
    ).all()
    if rank_rows:
        latest_year = max(r.year for r in rank_rows)
        year_rows = [r for r in rank_rows if r.year == latest_year]
        exact = next((r for r in year_rows if r.score == req.score), None)
        if exact is None:
            below = [r for r in year_rows if r.score < req.score]
            exact = max(below, key=lambda r: r.score) if below else None
        candidate_rank = exact.rank if exact else None
    else:
        candidate_rank = _approx_rank(score_rows, req.score)
    if candidate_rank is None:
        raise ERR_SCORE_OUT_OF_RANGE

    # 3. 算法分档（直接传递 settings，不再构造 thresholds 字典）
    items = recommend(candidate_rank, school_history, settings)
    if not items:
        raise ERR_NO_CANDIDATE
    # ponytail: 真实数据候选可达上千，截断到前 60 避免前端渲染卡顿
    items = items[:60]

    # 4. 补校名输出
    id_to_name = {s.school_id: s.name for s in session.exec(select(SchoolInfo)).all()}
    return ApiResponse(data=[
        RecommendItemOut(
            school_id=it.school_id, school_name=id_to_name.get(it.school_id, ""),
            tier=it.tier.value, probability=it.probability,
            rank_mean=it.rank_mean, rank_min=it.rank_min, rank_max=it.rank_max,
        ) for it in items
    ])
