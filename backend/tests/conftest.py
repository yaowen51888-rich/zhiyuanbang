"""测试 fixtures：内存 SQLite + 建表 + 注入到 FastAPI。"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

# 在导入 main 前替换引擎为内存 SQLite
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})


@pytest.fixture(name="session")
def session_fixture():
    # 每个测试用全新表，避免数据互相污染
    import app.db as db  # noqa
    db.engine = test_engine
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as s:
        yield s
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(name="client")
def client_fixture(session: Session):
    from app.db import get_session
    from app.main import app

    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
