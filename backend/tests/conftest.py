"""测试 fixtures：内存 SQLite + 建表 + 注入到 FastAPI。"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

# 确保所有模型都被注册到 metadata
from app.models import MajorInfo, Province, SchoolDetail, SchoolInfo, MajorScore, SchoolScore

# 使用共享缓存的内存数据库，确保多个连接访问同一个数据库
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)


@pytest.fixture(name="session")
def session_fixture():
    # 替换引擎
    import app.db as db  # noqa
    db.engine = test_engine

    # 创建表
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
