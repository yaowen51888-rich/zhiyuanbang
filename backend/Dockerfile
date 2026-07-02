FROM python:3.11-slim
WORKDIR /app
# scripts/*.py 的 import app 在容器内可解析（修脚本目录在 path 而非 cwd 的问题）
ENV PYTHONPATH=/app

COPY pyproject.toml ./
RUN pip install --no-cache-dir .          # 仅主依赖；dev 在 optional-dependencies 不装

COPY app ./app
# 含 fetch_data.py + seed_dev.py（seed_full.json 运行时由 fetch_data.py 下载，不入镜像）
COPY scripts ./scripts

EXPOSE 8000
# 建表 → 首启灌江苏种子(已种子则跳过) → 启动；不改 app 代码
CMD ["sh", "-c", "python -c 'import app.models; from sqlmodel import SQLModel; from app.db import engine; SQLModel.metadata.create_all(engine)' && python scripts/fetch_data.py && python scripts/seed_dev.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
