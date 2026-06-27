from app.models import Province, ScoreRank
from app.models.enums import SubjectType


def _seed(session):
    session.add(Province(province_id=51, name="四川", code="51"))
    for sc, rk in [(700, 100), (680, 500), (600, 5000)]:
        session.add(ScoreRank(province_id=51, year=2022, subject_type=SubjectType.science,
                              score=sc, rank=rk))
    session.commit()


def test_score_to_rank_exact(client, session):
    _seed(session)
    resp = client.get("/score-rank", params={"province_id": 51, "year": 2022,
                                             "subject_type": "science", "score": 600})
    assert resp.json()["data"]["rank"] == 5000


def test_score_to_rank_missing_data(client, session):
    resp = client.get("/score-rank", params={"province_id": 99, "year": 2022,
                                             "subject_type": "science", "score": 600})
    assert resp.status_code == 400 and resp.json()["code"] == 2001
