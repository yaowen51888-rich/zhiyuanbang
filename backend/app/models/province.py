"""省份字典。gaokao_type 为阶段 3 新高考预留。"""
from enum import Enum

from sqlmodel import Field, SQLModel


class GaokaoType(str, Enum):
    old = "old"             # 老高考（文理）
    new_3_3 = "new_3_3"     # 新高考 3+3
    new_3_1_2 = "new_3_1_2"  # 新高考 3+1+2


class Province(SQLModel, table=True):
    province_id: int | None = Field(primary_key=True)
    name: str
    code: str
    gaokao_type: GaokaoType = GaokaoType.old
