"""学校基本信息 + 详情。"""
from sqlmodel import Field, SQLModel


class SchoolInfo(SQLModel, table=True):
    school_id: int | None = Field(primary_key=True)
    name: str
    province: str = ""        # 学校所在省（展示用，非生源省）
    city: str = ""
    is_985: bool = False
    is_211: bool = False
    belongs: str = ""
    level: str = ""           # 办学层次
    type: str = ""            # 综合/理工/...
    nature: str = ""          # 公办/民办


class SchoolDetail(SQLModel, table=True):
    school_id: int | None = Field(primary_key=True, foreign_key="schoolinfo.school_id")
    intro: str = ""
