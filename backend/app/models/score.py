"""分数线/位次表（核心，全国化维度）。"""
from sqlmodel import Field, SQLModel

from app.models.enums import SubjectType


class ScoreRank(SQLModel, table=True):
    """一分一段表：分数→位次（按省/年/科类）。"""
    id: int | None = Field(primary_key=True)
    province_id: int = Field(foreign_key="province.province_id", index=True)
    year: int = Field(index=True)
    subject_type: SubjectType = Field(index=True)
    score: int
    num: int = 0              # 该分数人数
    rank: int                 # 累计位次
    batch: str = ""


class SchoolScore(SQLModel, table=True):
    """学校录取分数线（纵向一年一行，替代原横向 sc_li_score）。"""
    id: int | None = Field(primary_key=True)
    school_id: int = Field(foreign_key="schoolinfo.school_id", index=True)
    province_id: int = Field(foreign_key="province.province_id", index=True)
    year: int
    subject_type: SubjectType
    batch: str = ""
    score: int                # 录取最低分
    rank: int                 # 录取最低位次


class MajorScore(SQLModel, table=True):
    """专业录取分数线（补 year/subject_type）。"""
    id: int | None = Field(primary_key=True)
    school_id: int = Field(foreign_key="schoolinfo.school_id", index=True)
    major_id: int = Field(foreign_key="majorinfo.major_id", index=True)
    province_id: int = Field(foreign_key="province.province_id")
    year: int
    subject_type: SubjectType
    batch: str = ""
    max_score: int | None = None
    min_score: int | None = None
    avg_score: int | None = None
    min_rank: int | None = None
