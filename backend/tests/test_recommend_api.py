from app.models import Province, ScoreRank, SchoolInfo, SchoolScore
from app.models.enums import SubjectType


def _seed(session):
    session.add(Province(province_id=51, name="四川", code="51"))
    # 一分一段表：600分→位次5000
    session.add(ScoreRank(province_id=51, year=2022, subject_type=SubjectType.science,
                          score=600, rank=5000))
    # 三所学校近 3 年录取位次（决定分档）
    # 学校A：位次~4500 → 考生5000 < 4500? 否；ratio=5000/4500=1.11 → 冲
    for y, rk in [(2022, 4500), (2021, 4600), (2020, 4400)]:
        session.add(SchoolScore(school_id=1, province_id=51, year=y,
                                subject_type=SubjectType.science, batch="本科一批", score=610, rank=rk))
    # 学校B：位次~5500 → ratio=5000/5500=0.91 → 保
    for y, rk in [(2022, 5500), (2021, 5600), (2020, 5400)]:
        session.add(SchoolScore(school_id=2, province_id=51, year=y,
                                subject_type=SubjectType.science, batch="本科一批", score=590, rank=rk))
    session.add(SchoolInfo(school_id=1, name="冲校"))
    session.add(SchoolInfo(school_id=2, name="保校"))
    session.commit()


def test_recommend_returns_tiered(client, session):
    _seed(session)
    resp = client.post("/recommend", json={
        "province_id": 51, "subject_type": "science", "score": 600, "batch": "本科一批"})
    assert resp.status_code == 200
    items = resp.json()["data"]
    tiers = {it["school_name"]: it["tier"] for it in items}
    assert tiers["冲校"] == "rush"
    assert tiers["保校"] == "safe"
    # 冲校在最前
    assert items[0]["school_name"] == "冲校"
    # 概率在合理范围
    assert all(0.0 <= it["probability"] <= 100.0 for it in items)
