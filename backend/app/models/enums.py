"""科类枚举。老高考文/理 + 新高考科类（物理类/历史类/综合）。"""
from enum import Enum


class SubjectType(str, Enum):
    liberal = "liberal"           # 文科（老高考）
    science = "science"           # 理科（老高考）
    physics = "physics"           # 物理类（新高考 3+1+2）
    history = "history"           # 历史类（新高考 3+1+2）
    comprehensive = "comprehensive"  # 综合（新高考 3+3）
