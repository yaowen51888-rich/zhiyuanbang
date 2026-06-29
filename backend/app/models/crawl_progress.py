"""采集进度：记录已采学校（含无数据校），供小批量断点续传去重。"""
from sqlmodel import Field, SQLModel


class CrawlProgress(SQLModel, table=True):
    province_id: int = Field(foreign_key="province.province_id", primary_key=True)
    school_id: int = Field(foreign_key="schoolinfo.school_id", primary_key=True)
