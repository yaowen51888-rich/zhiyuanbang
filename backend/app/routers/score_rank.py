"""分数→位次查询。"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.db import get_session
from app.errors import ERR_NO_RANK_DATA, ERR_SCORE_OUT_OF_RANGE
from app.models import ScoreRank
from app.models.enums import SubjectType
from app.schemas.common import ApiResponse
from app.schemas.recommend import ScoreRankOut

router = APIRouter(prefix="/score-rank", tags=["score_rank"])


@router.get("", response_model=ApiResponse[ScoreRankOut])
def score_to_rank(
    province_id: int = Query(...),
    year: int = Query(...),
    subject_type: SubjectType = Query(...),
    score: int = Query(..., ge=0, le=750),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(ScoreRank).where(
            ScoreRank.province_id == province_id,
            ScoreRank.year == year,
            ScoreRank.subject_type == subject_type,
        )
    ).all()
    if not rows:
        raise ERR_NO_RANK_DATA
    max_score = max(r.score for r in rows)
    if score > max_score:
        raise ERR_SCORE_OUT_OF_RANGE
    # 取该分数对应位次；若精确分数缺失，取不高于该分数的最大分数的位次
    matched = [r for r in rows if r.score == score]
    if not matched:
        matched = [r for r in rows if r.score < score]
        matched = [max(matched, key=lambda r: r.score)] if matched else []
    if not matched:
        raise ERR_SCORE_OUT_OF_RANGE
    return ApiResponse(data=ScoreRankOut(score=score, rank=matched[0].rank))
