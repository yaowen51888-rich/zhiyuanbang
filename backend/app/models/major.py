"""专业信息。"""
from sqlmodel import Field, SQLModel


class MajorInfo(SQLModel, table=True):
    major_id: int | None = Field(primary_key=True)
    name: str
    category: str = ""        # 学科门类
    subcategory: str = ""     # 专业类
    specific: str = ""        # 具体专业
