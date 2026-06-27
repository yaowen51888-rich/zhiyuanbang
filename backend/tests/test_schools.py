from app.models import Province, SchoolInfo, SchoolDetail, SchoolScore
from app.models.enums import SubjectType


def _seed(session):
    session.add(Province(province_id=51, name="四川", code="51"))
    session.add(SchoolInfo(school_id=1, name="电子科技大学", province="四川", is_985=True, type="理工"))
    session.add(SchoolInfo(school_id=2, name="四川大学", province="四川", is_985=True, type="综合"))
    session.add(SchoolDetail(school_id=1, intro="位于成都"))
    session.add(SchoolScore(school_id=1, province_id=51, year=2022,
                            subject_type=SubjectType.science, batch="本科一批", score=640, rank=2000))
    session.commit()


def test_list_schools_filter(client, session):
    _seed(session)
    resp = client.get("/schools", params={"is_985": True, "type": "理工"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    names = [s["name"] for s in body["data"]["items"]]
    assert names == ["电子科技大学"]


def test_school_detail_with_scores(client, session):
    _seed(session)
    resp = client.get("/schools/1")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["name"] == "电子科技大学"
    assert data["intro"] == "位于成都"
    assert data["history_scores"][0]["year"] == 2022
