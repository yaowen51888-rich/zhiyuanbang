"""科类枚举。阶段 1 仅文/理；阶段 3 扩展选科。"""
from enum import Enum


class SubjectType(str, Enum):
    liberal = "liberal"   # 文科
    science = "science"   # 理科
