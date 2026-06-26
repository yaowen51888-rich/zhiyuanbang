"""数据库引擎与会话。"""
from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# 生产 PG / 开发 SQLite 均由 DATABASE_URL 控制
engine = create_engine(settings.database_url, echo=False)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
