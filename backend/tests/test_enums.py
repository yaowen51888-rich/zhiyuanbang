"""SubjectType 枚举值测试。"""
from app.models.enums import SubjectType


def test_subject_type_has_new_gaokao_values():
    """新高考科类值存在且字符串值稳定（DB 存的是字符串）。"""
    assert SubjectType.physics.value == "physics"
    assert SubjectType.history.value == "history"
    assert SubjectType.comprehensive.value == "comprehensive"


def test_subject_type_keeps_old_values():
    """老高考文/理值不变（向后兼容）。"""
    assert SubjectType.science.value == "science"
    assert SubjectType.liberal.value == "liberal"
