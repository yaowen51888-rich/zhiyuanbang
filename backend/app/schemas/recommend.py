from pydantic import BaseModel, Field

from app.models.enums import SubjectType


class ScoreRankOut(BaseModel):
    score: int
    rank: int


class RecommendRequest(BaseModel):
    province_id: int
    subject_type: SubjectType
    score: int = Field(ge=0, le=750)
    batch: str = "本科一批"


class RecommendItemOut(BaseModel):
    school_id: int
    school_name: str
    tier: str            # rush/stable/safe/pad
    probability: float
    rank_mean: float
    rank_min: int
    rank_max: int
