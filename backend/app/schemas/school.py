from pydantic import BaseModel


class SchoolOut(BaseModel):
    school_id: int
    name: str
    province: str
    city: str
    is_985: bool
    is_211: bool
    belongs: str
    level: str
    type: str
    nature: str


class SchoolYearScore(BaseModel):
    year: int
    score: int
    rank: int


class SchoolDetailOut(SchoolOut):
    intro: str
    history_scores: list[SchoolYearScore] = []
