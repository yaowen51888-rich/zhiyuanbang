"""集中导出，确保建表覆盖全部。"""
from app.models.enums import SubjectType
from app.models.major import MajorInfo
from app.models.province import Province
from app.models.school import SchoolDetail, SchoolInfo
from app.models.score import MajorScore, ScoreRank, SchoolScore

__all__ = [
    "SubjectType", "Province", "SchoolInfo", "SchoolDetail",
    "MajorInfo", "ScoreRank", "SchoolScore", "MajorScore",
]
