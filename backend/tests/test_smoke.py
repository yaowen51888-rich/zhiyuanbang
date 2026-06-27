"""冒烟测试：验证 FastAPI + fixtures 链路。"""


def test_health(client):
    """验证 /health 端点返回 200 且响应正确。"""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
