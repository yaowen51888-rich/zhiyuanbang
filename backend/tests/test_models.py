"""测试数据模型：验证建表、增查、枚举行为。"""
from sqlmodel import Session, select

from app.models import Province, SchoolInfo, ScoreRank, SubjectType


def test_models_create_and_query(session: Session):
    """验证核心模型可写入、可查询，枚举正确存储。"""
    session.add(Province(province_id=51, name="四川", code="51"))
    session.add(SchoolInfo(school_id=1, name="测试大学", province="四川"))
    session.add(ScoreRank(province_id=51, year=2022, subject_type=SubjectType.science,
                          score=600, num=10, rank=1000, batch="本科一批"))
    session.commit()

    assert session.exec(select(Province).where(Province.name == "四川")).first() is not None
    assert session.exec(select(SchoolInfo).where(SchoolInfo.name == "测试大学")).first() is not None
    sr = session.exec(select(ScoreRank)).first()
    assert sr is not None and sr.rank == 1000
    assert sr.subject_type == SubjectType.science
