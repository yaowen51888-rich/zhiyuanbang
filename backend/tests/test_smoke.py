"""冒烟测试：验证 FastAPI + fixtures 链路。"""


def test_health(client):
    """验证 /health 端点返回 200 且响应正确。"""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_schemas_instantiate():
    from app.schemas.common import ApiResponse, Page
    from app.schemas.recommend import RecommendRequest
    from app.models.enums import SubjectType

    r = RecommendRequest(province_id=51, subject_type=SubjectType.science, score=580)
    assert r.score == 580
    assert ApiResponse(data=Page(items=[], total=0)).code == 0
