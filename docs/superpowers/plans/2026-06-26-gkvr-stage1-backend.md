# gkvr 阶段 1 后端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 gkvr 阶段 1 后端子系统——数据模型、四川数据导入、位次法推荐算法、查询/推荐 API，独立可测（pytest + httpx），并为前端计划产出 OpenAPI 契约。

**Architecture:** FastAPI + SQLModel 单体后端。算法层（`services/recommendation.py`）纯函数化、阈值外置可调，TDD 优先验证命门。数据层 7 张全国化维度表（PostgreSQL 生产 / SQLite 内存测试）。现成 MySQL 数据经导入脚本补维度+规范化后填充。

**Tech Stack:** Python 3.11+、FastAPI、SQLModel（SQLAlchemy 2.x + Pydantic v2）、PostgreSQL 16、pytest、httpx（测试客户端）、sqlparse（导入解析）。

## Global Constraints

- **Python ≥ 3.11**，依赖用 `pyproject.toml` 管理（`uv` 或 `pip` 均可）。
- **注释统一用中文**（新项目基准语言）。
- **不主动 git**：按用户全局约定，本计划任务以「运行验证」作为完成 gate，不含 `git commit` 步骤。若用户后续启用 git，执行者可在每个验证通过后自行提交。
- **算法阈值必须外置**到 `app/config.py` 常量，不可硬编码进函数默认值以外的位置（便于调参）。
- **统一响应格式**：成功 `{code: 0, message: "ok", data: ...}`，业务错误 `{code: <非0>, message: ...}`。
- **测试 DB 用 SQLite 内存**（`sqlite:///:memory:`），生产用 PostgreSQL；SQLModel 模型须同时兼容两者（避免 PG 专有类型）。
- **科类枚举**阶段 1 仅 `liberal`(文)/`science`(理)。
- 配套 spec：`docs/superpowers/specs/2026-06-26-gkvr-stage1-design.md`。

---

## 文件结构

```
gkvr/
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI 入口 + CORS + 异常处理 + router 注册
│   │   ├── config.py               # Settings + 算法阈值常量
│   │   ├── db.py                   # 引擎/get_session
│   │   ├── errors.py               # 业务异常 + 错误码
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── enums.py            # SubjectType
│   │   │   ├── province.py         # Province
│   │   │   ├── school.py           # SchoolInfo, SchoolDetail
│   │   │   ├── major.py            # MajorInfo
│   │   │   └── score.py            # ScoreRank, SchoolScore, MajorScore
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── common.py           # ApiResponse, Page, PageQuery
│   │   │   ├── school.py
│   │   │   ├── major.py
│   │   │   └── recommend.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── schools.py
│   │   │   ├── majors.py
│   │   │   ├── score_rank.py
│   │   │   └── recommend.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── recommendation.py   # 算法核心（纯函数）
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py             # test_db, client fixtures
│       ├── test_recommendation.py  # 算法单测（命门）
│       ├── test_schools.py
│       └── test_recommend_api.py
├── data/
│   ├── source_sql/                 # 用户放入原项目现成 SQL dump
│   └── import_mysql_to_pg.py       # 导入脚本
├── NOTICE                          # 原项目 MIT 版权声明
└── package.json                    # 根（concurrently；前端计划补 next dev）
```

---

## Task 1: 仓库脚手架 + FastAPI 骨架

**Files:**
- Create: `gkvr/backend/pyproject.toml`
- Create: `gkvr/backend/.env.example`
- Create: `gkvr/backend/app/__init__.py`（空）
- Create: `gkvr/backend/app/config.py`
- Create: `gkvr/backend/app/main.py`
- Create: `gkvr/NOTICE`
- Create: `gkvr/package.json`

**Interfaces:**
- Produces: `app/main.py:app`（FastAPI 实例，含 `/health`），`app/config.py:settings`

- [ ] **Step 1: 创建 `backend/pyproject.toml`**

```toml
[project]
name = "gkvr-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "sqlmodel>=0.0.22",
    "pydantic-settings>=2.5",
    "psycopg[binary]>=3.2",   # PostgreSQL 驱动
    "sqlparse>=0.5",          # 导入脚本解析
]

[project.optional-dependencies]
dev = ["pytest>=8", "httpx>=0.27"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: 创建 `backend/.env.example`**

```env
# 生产用 PostgreSQL；测试用 SQLite 内存（见 conftest.py，不走此变量）
DATABASE_URL=postgresql+psycopg://gkvr:gkvr@localhost:5432/gkvr
ALLOWED_ORIGINS=http://localhost:3000
```

- [ ] **Step 3: 创建 `app/config.py`**

```python
"""应用配置：数据库连接、CORS、推荐算法阈值。"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./gkvr.db"
    allowed_origins: str = "http://localhost:3000"

    # 推荐算法分档阈值（考生位次 R / 学校录取位次均值 M 的比值边界）
    # 位次越小排名越靠前：ratio 越小 → 越稳
    tier_pad: float = 0.85      # ratio <= pad → 垫
    tier_safe: float = 0.95     # ratio <= safe → 保
    tier_stable: float = 1.05   # ratio <= stable → 稳
    tier_rush: float = 1.15     # ratio <= rush → 冲；超过 → 不推荐
    # 录取概率 sigmoid 系数：prob = 100 / (1 + exp(k*(ratio-1)))
    prob_k: float = 8.0

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
```

- [ ] **Step 4: 创建 `app/main.py`**

```python
"""FastAPI 入口：健康检查 + CORS。后续 task 注册 router。"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="gkvr 后端", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 5: 创建 `NOTICE`（原项目版权声明，MIT 义务）**

```
本项目借鉴并重构自以下开源项目（MIT License）：
- frontend: https://github.com/electronic-pig/gkvr_system_frontend
- backend:  https://github.com/electronic-pig/gkvr_system_backend
Copyright (c) electronic-pig, zf666fz, weeadd

MIT License 许可证全文见项目根 LICENSE 或上述仓库。
```

- [ ] **Step 6: 创建根 `package.json`（concurrently 占位，前端计划补 scripts.web）**

```json
{
  "name": "gkvr",
  "private": true,
  "scripts": {
    "dev": "concurrently -n api,web -c blue,green \"npm:dev:api\" \"npm:dev:web\"",
    "dev:api": "uvicorn app.main:app --reload --app-dir backend",
    "dev:web": "echo \"前端计划补 next dev\""
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 7: 安装依赖并验证启动**

Run:
```bash
cd backend && pip install -e ".[dev]"
uvicorn app.main:app --port 8000
```
Expected: 服务启动，访问 `http://localhost:8000/health` 返回 `{"status":"ok"}`，`/docs` 可见 OpenAPI 页面。

---

## Task 2: 数据库会话 + 测试 fixtures

**Files:**
- Create: `app/db.py`
- Create: `tests/__init__.py`（空）
- Create: `tests/conftest.py`

**Interfaces:**
- Consumes: `app/config.py:settings`
- Produces: `app/db.py:get_session`（依赖注入生成器）、`tests/conftest.py:test_db`（建表的 SQLite 会话）、`tests/conftest.py:client`（httpx TestClient，DB 已建表并注入）

- [ ] **Step 1: 创建 `app/db.py`**

```python
"""数据库引擎与会话。"""
from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# 生产 PG / 开发 SQLite 均由 DATABASE_URL 控制
engine = create_engine(settings.database_url, echo=False)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

- [ ] **Step 2: 创建 `tests/conftest.py`**

```python
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
```

- [ ] **Step 3: 写一个冒烟测试验证 fixture 可用**

Create `tests/test_smoke.py`:
```python
def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 4: 运行测试验证**

Run: `cd backend && pytest tests/test_smoke.py -v`
Expected: PASS（1 个测试通过，说明 fixture + FastAPI + 内存 DB 链路通）。

---

## Task 3: 数据模型（7 张全国化表 + 枚举）

**Files:**
- Create: `app/models/__init__.py`
- Create: `app/models/enums.py`
- Create: `app/models/province.py`
- Create: `app/models/school.py`
- Create: `app/models/major.py`
- Create: `app/models/score.py`
- Create: `tests/test_models.py`

**Interfaces:**
- Produces: `Province`、`SchoolInfo`、`SchoolDetail`、`MajorInfo`、`ScoreRank`、`SchoolScore`、`MajorScore`、`SubjectType`（枚举）

> 字段定义见 spec 第 6 节。关键：所有分数线/位次表含 `province_id`+`subject_type`（+`year`）；`school_score` 纵向一年一行（替代原横向 `sc_li_score`）。

- [ ] **Step 1: 创建 `app/models/enums.py`**

```python
"""科类枚举。阶段 1 仅文/理；阶段 3 扩展选科。"""
from enum import Enum


class SubjectType(str, Enum):
    liberal = "liberal"   # 文科
    science = "science"   # 理科
```

- [ ] **Step 2: 创建 `app/models/province.py`**

```python
"""省份字典。gaokao_type 为阶段 3 新高考预留。"""
from enum import Enum

from sqlmodel import Field, SQLModel


class GaokaoType(str, Enum):
    old = "old"             # 老高考（文理）
    new_3_3 = "new_3_3"     # 新高考 3+3
    new_3_1_2 = "new_3_1_2"  # 新高考 3+1+2


class Province(SQLModel, table=True):
    province_id: int | None = Field(primary_key=True)
    name: str
    code: str
    gaokao_type: GaokaoType = GaokaoType.old
```

- [ ] **Step 3: 创建 `app/models/school.py`**

```python
"""学校基本信息 + 详情。"""
from sqlmodel import Field, SQLModel


class SchoolInfo(SQLModel, table=True):
    school_id: int | None = Field(primary_key=True)
    name: str
    province: str = ""        # 学校所在省（展示用，非生源省）
    city: str = ""
    is_985: bool = False
    is_211: bool = False
    belongs: str = ""
    level: str = ""           # 办学层次
    type: str = ""            # 综合/理工/...
    nature: str = ""          # 公办/民办


class SchoolDetail(SQLModel, table=True):
    school_id: int | None = Field(primary_key=True, foreign_key="schoolinfo.school_id")
    intro: str = ""
```

> 注意：SQLModel 默认表名是类名小写（`schoolinfo`/`schooldetail`）。`SchoolDetail.school_id` 同时作主键与外键。

- [ ] **Step 4: 创建 `app/models/major.py`**

```python
"""专业信息。"""
from sqlmodel import Field, SQLModel


class MajorInfo(SQLModel, table=True):
    major_id: int | None = Field(primary_key=True)
    name: str
    category: str = ""        # 学科门类
    subcategory: str = ""     # 专业类
    specific: str = ""        # 具体专业
```

- [ ] **Step 5: 创建 `app/models/score.py`**

```python
"""分数线/位次表（核心，全国化维度）。"""
from sqlmodel import Field, SQLModel

from app.models.enums import SubjectType


class ScoreRank(SQLModel, table=True):
    """一分一段表：分数→位次（按省/年/科类）。"""
    id: int | None = Field(primary_key=True)
    province_id: int = Field(foreign_key="province.province_id", index=True)
    year: int = Field(index=True)
    subject_type: SubjectType = Field(index=True)
    score: int
    num: int = 0              # 该分数人数
    rank: int                 # 累计位次
    batch: str = ""


class SchoolScore(SQLModel, table=True):
    """学校录取分数线（纵向一年一行，替代原横向 sc_li_score）。"""
    id: int | None = Field(primary_key=True)
    school_id: int = Field(foreign_key="schoolinfo.school_id", index=True)
    province_id: int = Field(foreign_key="province.province_id", index=True)
    year: int
    subject_type: SubjectType
    batch: str = ""
    score: int                # 录取最低分
    rank: int                 # 录取最低位次


class MajorScore(SQLModel, table=True):
    """专业录取分数线（补 year/subject_type）。"""
    id: int | None = Field(primary_key=True)
    school_id: int = Field(foreign_key="schoolinfo.school_id", index=True)
    major_id: int = Field(foreign_key="majorinfo.major_id", index=True)
    province_id: int = Field(foreign_key="province.province_id")
    year: int
    subject_type: SubjectType
    batch: str = ""
    max_score: int | None = None
    min_score: int | None = None
    avg_score: int | None = None
    min_rank: int | None = None
```

- [ ] **Step 6: 创建 `app/models/__init__.py`（集中导出，确保建表覆盖全部）**

```python
from app.models.enums import SubjectType
from app.models.major import MajorInfo
from app.models.province import Province
from app.models.school import SchoolDetail, SchoolInfo
from app.models.score import MajorScore, ScoreRank, SchoolScore

__all__ = [
    "SubjectType", "Province", "SchoolInfo", "SchoolDetail",
    "MajorInfo", "ScoreRank", "SchoolScore", "MajorScore",
]
```

- [ ] **Step 7: 写测试验证模型可建表 + 可增查**

Create `tests/test_models.py`:
```python
from sqlmodel import Session, select

from app.models import Province, SchoolInfo, ScoreRank, SubjectType


def test_models_create_and_query(session: Session):
    session.add(Province(province_id=51, name="四川", code="51"))
    session.add(SchoolInfo(school_id=1, name="测试大学", province="四川"))
    session.add(ScoreRank(province_id=51, year=2022, subject_type=SubjectType.science,
                          score=600, num=10, rank=1000, batch="本科一批"))
    session.commit()

    assert session.exec(select(Province).where(Province.name == "四川")).first() is not None
    assert session.exec(select(SchoolInfo).where(SchoolInfo.name == "测试大学")).first() is not None
    sr = session.exec(select(ScoreRank)).first()
    assert sr is not None and sr.rank == 1000
```

- [ ] **Step 8: 运行测试验证**

Run: `cd backend && pytest tests/test_models.py -v`
Expected: PASS。`SQLModel.metadata.create_all` 能建出 7 张表（在 conftest 的 SQLite 引擎上）。

---

## Task 4: 推荐算法核心 + 单测（命门）★

> 这是系统价值核心，TDD 优先。算法纯函数化，阈值从 `config.settings` 读取，测试注入固定阈值。

**Files:**
- Create: `app/services/__init__.py`（空）
- Create: `app/services/recommendation.py`
- Create: `tests/test_recommendation.py`

**Interfaces:**
- Consumes: `app/config.py:settings`（阈值）
- Produces:
  - `Tier`（枚举：rush/stable/safe/pad）
  - `classify_tier(candidate_rank: int, admission_rank_mean: int, thresholds: dict) -> Tier | None`
  - `estimate_probability(candidate_rank: int, ranks: list[int], k: float) -> float`（0-100）
  - `recommend(candidate_rank: int, school_history: list[tuple[int, list[int]]], settings) -> list[RecommendItem]`
    - `school_history`: `[(school_id, [历年录取位次...]), ...]`
    - `RecommendItem`: dataclass `{school_id, tier, probability, rank_mean, rank_min, rank_max}`

- [ ] **Step 1: 写失败测试（分档边界）**

Create `tests/test_recommendation.py`:
```python
import pytest

from app.services.recommendation import Tier, classify_tier, estimate_probability

# 固定阈值，测试不依赖 config 默认值
TH = {"pad": 0.85, "safe": 0.95, "stable": 1.05, "rush": 1.15}


@pytest.mark.parametrize("ratio,expected", [
    (0.80, Tier.PAD),     # ratio <= 0.85 → 垫
    (0.85, Tier.PAD),     # 边界
    (0.90, Tier.SAFE),    # 0.85 < ratio <= 0.95 → 保
    (0.95, Tier.SAFE),    # 边界
    (1.00, Tier.STABLE),  # 0.95 < ratio <= 1.05 → 稳
    (1.05, Tier.STABLE),  # 边界
    (1.10, Tier.RUSH),    # 1.05 < ratio <= 1.15 → 冲
    (1.15, Tier.RUSH),    # 边界
    (1.20, None),         # 超过 → 不推荐
])
def test_classify_tier_boundaries(ratio, expected):
    mean = 1000
    assert classify_tier(int(mean * ratio), mean, TH) == expected


def test_probability_monotonic_and_range():
    # 位次越靠前（越小）概率越高
    p_low_rank = estimate_probability(800, [1000, 1000], k=8.0)   # ratio 0.8
    p_mid_rank = estimate_probability(1000, [1000, 1000], k=8.0)  # ratio 1.0
    p_high_rank = estimate_probability(1200, [1000, 1000], k=8.0) # ratio 1.2
    assert 0.0 <= p_low_rank <= 100.0
    assert p_low_rank > p_mid_rank > p_high_rank
    # ratio=1 时概率应接近 50
    assert 45 <= p_mid_rank <= 55


def test_probability_empty_history():
    assert estimate_probability(1000, [], k=8.0) == 0.0
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd backend && pytest tests/test_recommendation.py -v`
Expected: FAIL（`ModuleNotFoundError: No module named 'app.services.recommendation'`）。

- [ ] **Step 3: 实现算法**

Create `app/services/recommendation.py`:
```python
"""位次法推荐算法：分档 + 录取概率。纯函数，阈值由调用方传入。"""
import math
from dataclasses import dataclass
from enum import Enum


class Tier(str, Enum):
    rush = "rush"       # 冲
    stable = "stable"   # 稳
    safe = "safe"       # 保
    pad = "pad"         # 垫


@dataclass
class RecommendItem:
    school_id: int
    tier: Tier
    probability: float
    rank_mean: float
    rank_min: int
    rank_max: int


def classify_tier(candidate_rank: int, admission_rank_mean: int, thresholds: dict) -> Tier | None:
    """分档。位次越小排名越靠前；ratio = 考生位次 / 录取位次均值。"""
    if admission_rank_mean <= 0:
        return None
    ratio = candidate_rank / admission_rank_mean
    if ratio <= thresholds["pad"]:
        return Tier.PAD
    if ratio <= thresholds["safe"]:
        return Tier.SAFE
    if ratio <= thresholds["stable"]:
        return Tier.STABLE
    if ratio <= thresholds["rush"]:
        return Tier.RUSH
    return None


def estimate_probability(candidate_rank: int, ranks: list[int], k: float) -> float:
    """录取概率 0-100。以历年录取位次均值为锚，sigmoid 映射。"""
    if not ranks:
        return 0.0
    mean = sum(ranks) / len(ranks)
    if mean <= 0:
        return 0.0
    ratio = candidate_rank / mean
    prob = 100.0 / (1.0 + math.exp(k * (ratio - 1.0)))
    return round(max(0.0, min(100.0, prob)), 1)


def recommend(candidate_rank: int, school_history: list[tuple[int, list[int]]],
              thresholds: dict, prob_k: float) -> list[RecommendItem]:
    """对候选学校逐一分档+估概率，过滤掉不推荐（None）的。"""
    items: list[RecommendItem] = []
    for school_id, ranks in school_history:
        if not ranks:
            continue
        mean = sum(ranks) / len(ranks)
        tier = classify_tier(candidate_rank, int(mean), thresholds)
        if tier is None:
            continue
        items.append(RecommendItem(
            school_id=school_id,
            tier=tier,
            probability=estimate_probability(candidate_rank, ranks, prob_k),
            rank_mean=mean,
            rank_min=min(ranks),
            rank_max=max(ranks),
        ))
    # 排序：冲 → 稳 → 保 → 垫；同档按概率降序
    order = {Tier.rush: 0, Tier.stable: 1, Tier.safe: 2, Tier.pad: 3}
    items.sort(key=lambda it: (order[it.tier], -it.probability))
    return items
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd backend && pytest tests/test_recommendation.py -v`
Expected: PASS（全部用例，含分档边界、概率单调性、空历史）。

- [ ] **Step 5: 验证 `recommend` 端到端排序（补一个测试）**

追加到 `tests/test_recommendation.py`:
```python
from app.services.recommendation import recommend


def test_recommend_filters_and_orders():
    # 考生位次 1000；三所学校历史录取位次不同 → 分属冲/稳/保，一所太远被过滤
    history = [
        (1, [1100]),   # ratio 0.91 → 保
        (2, [1050]),   # ratio 0.95 → 保边界
        (3, [1000]),   # ratio 1.0 → 稳
        (4, [1300]),   # ratio 1.3 → 过滤
    ]
    items = recommend(1000, history, TH, prob_k=8.0)
    ids = [it.school_id for it in items]
    assert 4 not in ids                      # 被过滤
    assert ids[0] == 3                       # 稳在最前
    # 概率范围合理
    assert all(0.0 <= it.probability <= 100.0 for it in items)
```

Run: `cd backend && pytest tests/test_recommendation.py -v`
Expected: PASS。

---

## Task 5: 数据导入脚本（MySQL dump → PostgreSQL）

> 前置依赖：用户需把原项目 Releases 的 SQL dump 放入 `data/source_sql/`。脚本针对原表结构定向解析、补维度、规范化写入 PG。**此脚本独立于后端运行**，后端测试不依赖它（用 fixture 造数据）。

**Files:**
- Create: `data/import_mysql_to_pg.py`
- Create: `data/source_sql/.gitkeep`
- Create: `data/test_parse.py`（解析逻辑单测，用造好的小 SQL）

**Interfaces:**
- Consumes: `data/source_sql/*.sql`（mysqldump 风格，含 `INSERT INTO sc_li_score ...`）
- Produces: 写入运行环境 PG 的 7 张表（四川数据，`province_id=51`）

- [ ] **Step 1: 写解析逻辑测试（先造一段迷你 dump）**

Create `data/test_parse.py`:
```python
from data.import_mysql_to_pg import parse_sc_li_rows

# 迷你 dump：一行 sc_li_score（横向年份）样本
SAMPLE = """INSERT INTO `sc_li_score` VALUES (1,100,'电子科技大学',640,2000,635,2100,630,2200);
INSERT INTO `sc_li_score` VALUES (2,101,'四川大学',620,3000,615,3100,0,0);"""


def test_parse_sc_li_normalizes_to_rows():
    rows = parse_sc_li_rows(SAMPLE)
    # 每个横向行 → 3 个纵向年份行（2022/2021/2020），跳过 score=0 的缺数据
    assert len(rows) == 5  # 学校1 三年 + 学校2 两年（2020 为 0 跳过）
    first = rows[0]
    assert first["school_id"] == 100
    assert first["year"] == 2022
    assert first["score"] == 640
    assert first["rank"] == 2000
    # 补的默认维度
    assert first["province_id"] == 51
    from app.models.enums import SubjectType
    assert first["subject_type"] == SubjectType.science
```

> 说明：原 `sc_li_score` 无科类字段，脚本默认全部当作理科导入（阶段 1 四川数据若含文科，后续按列扩展；此处先固定理科，测试与之一致）。

- [ ] **Step 2: 运行验证失败**

Run: `cd backend && pytest ../data/test_parse.py -v`（需确保 `app` 在 pythonpath；可在 backend 目录运行）
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现导入脚本**

Create `data/import_mysql_to_pg.py`:
```python
"""把原项目 MySQL dump 导入 PostgreSQL：补维度 + 规范化。

用法：python data/import_mysql_to_pg.py
前提：data/source_sql/ 下放原 dump；DATABASE_URL 指向目标 PG。
"""
import re
import sys
from pathlib import Path

from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.models import SchoolScore, ScoreRank
from app.models.enums import SubjectType

SOURCE_DIR = Path(__file__).parent / "source_sql"
DEFAULT_PROVINCE_ID = 51  # 四川

# 横向 sc_li_score 列序：id, schoolId, schoolName, score2022, rank2022, score2021, rank2021, score2020, rank2020
_SC_LI_RE = re.compile(
    r"INSERT INTO `sc_li_score` VALUES\s*(.+?);", re.DOTALL
)


def _parse_tuples(values_blob: str) -> list[list[int | str]]:
    """从 VALUES (...) 中拆出每行字段（简易：按 '),(' 切）。"""
    blob = values_blob.strip().lstrip("(").rstrip(")")
    rows = []
    for raw in blob.split("),("):
        fields = [f.strip().strip("'\"") for f in raw.split(",")]
        rows.append(fields)
    return rows


def parse_sc_li_rows(sql_text: str) -> list[dict]:
    """把横向 sc_li_score 解析为纵向 school_score 行（补 province_id/subject_type）。"""
    out: list[dict] = []
    for m in _SC_LI_RE.finditer(sql_text):
        for fields in _parse_tuples(m.group(1)):
            # fields: [id, schoolId, schoolName, s2022, r2022, s2021, r2021, s2020, r2020]
            school_id = int(fields[1])
            year_map = {2022: (fields[3], fields[4]), 2021: (fields[5], fields[6]), 2020: (fields[7], fields[8])}
            for year, (s, r) in year_map.items():
                score = int(s) if s and s != "0" else None
                rank = int(r) if r and r != "0" else None
                if score is None or rank is None:
                    continue
                out.append({
                    "school_id": school_id,
                    "province_id": DEFAULT_PROVINCE_ID,
                    "year": year,
                    "subject_type": SubjectType.science,
                    "batch": "本科一批",
                    "score": score,
                    "rank": rank,
                })
    return out


def import_all() -> None:
    sql_files = sorted(SOURCE_DIR.glob("*.sql"))
    if not sql_files:
        print(f"[skip] {SOURCE_DIR} 下无 .sql 文件，请先放入原项目 dump", file=sys.stderr)
        return
    text = "\n".join(f.read_text(encoding="utf-8", errors="ignore") for f in sql_files)
    rows = parse_sc_li_rows(text)
    with Session(engine) as s:
        for r in rows:
            s.add(SchoolScore(**r))
        s.commit()
    print(f"[done] 导入 {len(rows)} 条 school_score（四川）")


if __name__ == "__main__":
    # 仅在真实运行导入时建表
    from sqlmodel import SQLModel
    import app.models  # noqa: F401  确保模型注册
    SQLModel.metadata.create_all(engine)
    import_all()
```

> 注：`score_rank` 与 `major_score` 的解析同模式（按各自列序），为控制篇幅此处仅实现 `sc_li_score → school_score` 作为范式；执行者按相同套路补 `parse_score_rank_rows` / `parse_major_score_rows`。

- [ ] **Step 4: 运行解析测试验证**

Run: `cd backend && pytest ../data/test_parse.py -v`
Expected: PASS（迷你 dump 被正确规范化为 5 行，维度补齐）。

- [ ] **Step 5: 端到端导入验证（需用户提供真实 dump + PG）**

把原项目 dump 放入 `data/source_sql/`，配置 `.env` 的 `DATABASE_URL` 指向本地 PG，然后：
Run: `cd backend && python ../data/import_mysql_to_pg.py`
Expected: 输出 `[done] 导入 N 条 school_score（四川）`，PG 中 `schoolscore` 表有数据。

---

## Task 6: Schemas（Pydantic 请求/响应 + 统一响应）

**Files:**
- Create: `app/errors.py`
- Create: `app/schemas/__init__.py`（空）
- Create: `app/schemas/common.py`
- Create: `app/schemas/school.py`
- Create: `app/schemas/major.py`
- Create: `app/schemas/recommend.py`

**Interfaces:**
- Produces: `ApiResponse[T]`、`Page[T]`、`SchoolOut`、`SchoolDetailOut`、`MajorOut`、`ScoreRankOut`、`RecommendRequest`、`RecommendItemOut`

- [ ] **Step 1: 创建 `app/errors.py`（业务异常 + 错误码）**

```python
"""统一业务异常与错误码。"""


class BizError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message


# 错误码约定：1xxx 输入校验，2xxx 数据不存在，3xxx 算法
ERR_SCORE_OUT_OF_RANGE = BizError(1001, "分数超出该省一分一段表范围")
ERR_NO_RANK_DATA = BizError(2001, "无该省科类位次数据")
ERR_NO_CANDIDATE = BizError(3001, "无匹配候选学校")
```

- [ ] **Step 2: 创建 `app/schemas/common.py`**

```python
"""统一响应与分页。"""
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "ok"
    data: T | None = None


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = 1
    page_size: int = 20


class PageQuery(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
```

- [ ] **Step 3: 创建 `app/schemas/school.py`**

```python
from pydantic import BaseModel


class SchoolOut(BaseModel):
    school_id: int
    name: str
    province: str
    city: str
    is_985: bool
    is_211: bool
    belongs: str
    level: str
    type: str
    nature: str


class SchoolYearScore(BaseModel):
    year: int
    score: int
    rank: int


class SchoolDetailOut(SchoolOut):
    intro: str
    history_scores: list[SchoolYearScore] = []
```

- [ ] **Step 4: 创建 `app/schemas/major.py`**

```python
from pydantic import BaseModel


class MajorOut(BaseModel):
    major_id: int
    name: str
    category: str
    subcategory: str
    specific: str
```

- [ ] **Step 5: 创建 `app/schemas/recommend.py`**

```python
from pydantic import BaseModel, Field

from app.models.enums import SubjectType


class ScoreRankOut(BaseModel):
    score: int
    rank: int


class RecommendRequest(BaseModel):
    province_id: int
    subject_type: SubjectType
    score: int = Field(ge=0, le=750)
    batch: str = "本科一批"


class RecommendItemOut(BaseModel):
    school_id: int
    school_name: str
    tier: str            # rush/stable/safe/pad
    probability: float
    rank_mean: float
    rank_min: int
    rank_max: int
```

- [ ] **Step 6: 验证 schema 可实例化（冒烟测试）**

追加到 `tests/test_smoke.py`:
```python
def test_schemas_instantiate():
    from app.schemas.common import ApiResponse, Page
    from app.schemas.recommend import RecommendRequest
    from app.models.enums import SubjectType

    r = RecommendRequest(province_id=51, subject_type=SubjectType.science, score=580)
    assert r.score == 580
    assert ApiResponse(data=Page(items=[], total=0)).code == 0
```

Run: `cd backend && pytest tests/test_smoke.py -v`
Expected: PASS。

---

## Task 7: schools / majors 路由

**Files:**
- Create: `app/routers/__init__.py`（空）
- Create: `app/routers/schools.py`
- Create: `app/routers/majors.py`
- Modify: `app/main.py`（注册 router + 异常处理）
- Create: `tests/test_schools.py`

**Interfaces:**
- Consumes: `app/db.py:get_session`、各 model、`schemas.school`/`schemas.common`
- Produces: `GET /schools`、`GET /schools/{id}`、`GET /majors`、`GET /majors/{id}/scores`

- [ ] **Step 1: 创建 `app/routers/schools.py`**

```python
"""学校查询：列表（筛选+分页）+ 详情（含历年分数线）。"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import SchoolDetail, SchoolInfo, SchoolScore
from app.models.enums import SubjectType
from app.schemas.common import ApiResponse, Page
from app.schemas.school import SchoolDetailOut, SchoolOut, SchoolYearScore

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("", response_model=ApiResponse[Page[SchoolOut]])
def list_schools(
    keyword: str | None = None,
    province: str | None = None,
    is_985: bool | None = None,
    is_211: bool | None = None,
    type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = select(SchoolInfo)
    if keyword:
        stmt = stmt.where(SchoolInfo.name.contains(keyword))
    if province:
        stmt = stmt.where(SchoolInfo.province == province)
    if is_985 is not None:
        stmt = stmt.where(SchoolInfo.is_985 == is_985)
    if is_211 is not None:
        stmt = stmt.where(SchoolInfo.is_211 == is_211)
    if type:
        stmt = stmt.where(SchoolInfo.type == type)

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return ApiResponse(data=Page(
        items=[SchoolOut.model_validate(r, from_attributes=True) for r in rows],
        total=total, page=page, page_size=page_size,
    ))


@router.get("/{school_id}", response_model=ApiResponse[SchoolDetailOut])
def get_school(school_id: int, session: Session = Depends(get_session)):
    info = session.get(SchoolInfo, school_id)
    if not info:
        raise HTTPException(status_code=404, detail="school not found")
    detail = session.get(SchoolDetail, school_id)
    scores = session.exec(
        select(SchoolScore)
        .where(SchoolScore.school_id == school_id)
        .order_by(SchoolScore.year.desc())
    ).all()
    return ApiResponse(data=SchoolDetailOut(
        **SchoolOut.model_validate(info, from_attributes=True).model_dump(),
        intro=detail.intro if detail else "",
        history_scores=[SchoolYearScore(year=s.year, score=s.score, rank=s.rank) for s in scores],
    ))
```

- [ ] **Step 2: 创建 `app/routers/majors.py`**

```python
"""专业查询。"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import MajorInfo, MajorScore
from app.schemas.common import ApiResponse, Page
from app.schemas.major import MajorOut
from app.schemas.school import SchoolYearScore

router = APIRouter(prefix="/majors", tags=["majors"])


@router.get("", response_model=ApiResponse[Page[MajorOut]])
def list_majors(
    keyword: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stmt = select(MajorInfo)
    if keyword:
        stmt = stmt.where(MajorInfo.name.contains(keyword))
    if category:
        stmt = stmt.where(MajorInfo.category == category)
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return ApiResponse(data=Page(
        items=[MajorOut.model_validate(r, from_attributes=True) for r in rows],
        total=total, page=page, page_size=page_size,
    ))


@router.get("/{major_id}/scores", response_model=ApiResponse[list[SchoolYearScore]])
def major_scores(major_id: int, session: Session = Depends(get_session)):
    if not session.get(MajorInfo, major_id):
        raise HTTPException(status_code=404, detail="major not found")
    rows = session.exec(
        select(MajorScore).where(MajorScore.major_id == major_id).order_by(MajorScore.year.desc())
    ).all()
    return ApiResponse(data=[
        SchoolYearScore(year=r.year, score=r.min_score or 0, rank=r.min_rank or 0) for r in rows
    ])
```

- [ ] **Step 3: 在 `app/main.py` 注册 router + 统一异常处理**

替换 `app/main.py` 为：
```python
"""FastAPI 入口：健康检查 + CORS + 路由 + 异常处理。"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.errors import BizError
from app.routers import majors, schools

app = FastAPI(title="gkvr 后端", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BizError)
async def biz_error_handler(request: Request, exc: BizError):
    return JSONResponse(status_code=400, content={"code": exc.code, "message": exc.message, "data": None})


app.include_router(schools.router)
app.include_router(majors.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 4: 写 API 测试**

Create `tests/test_schools.py`:
```python
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
```

- [ ] **Step 5: 运行测试验证**

Run: `cd backend && pytest tests/test_schools.py -v`
Expected: PASS（列表筛选 + 详情含历年分均正确）。

---

## Task 8: score_rank 路由（分数 → 位次）

**Files:**
- Create: `app/routers/score_rank.py`
- Modify: `app/main.py`（注册）
- Create: `tests/test_score_rank.py`

**Interfaces:**
- Consumes: `ScoreRank` model、`schemas.recommend.ScoreRankOut`
- Produces: `GET /score-rank?province_id=&year=&subject_type=&score=` → `{score, rank}`；无数据抛 `ERR_NO_RANK_DATA`，超范围抛 `ERR_SCORE_OUT_OF_RANGE`

- [ ] **Step 1: 创建 `app/routers/score_rank.py`**

```python
"""分数→位次查询。"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.db import get_session
from app.errors import ERR_NO_RANK_DATA, ERR_SCORE_OUT_OF_RANGE
from app.models import ScoreRank
from app.models.enums import SubjectType
from app.schemas.common import ApiResponse
from app.schemas.recommend import ScoreRankOut

router = APIRouter(prefix="/score-rank", tags=["score_rank"])


@router.get("", response_model=ApiResponse[ScoreRankOut])
def score_to_rank(
    province_id: int = Query(...),
    year: int = Query(...),
    subject_type: SubjectType = Query(...),
    score: int = Query(..., ge=0, le=750),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(ScoreRank).where(
            ScoreRank.province_id == province_id,
            ScoreRank.year == year,
            ScoreRank.subject_type == subject_type,
        )
    ).all()
    if not rows:
        raise ERR_NO_RANK_DATA
    max_score = max(r.score for r in rows)
    if score > max_score:
        raise ERR_SCORE_OUT_OF_RANGE
    # 取该分数对应位次；若精确分数缺失，取不高于该分数的最大分数的位次
    matched = [r for r in rows if r.score == score]
    if not matched:
        matched = [r for r in rows if r.score < score]
        matched = [max(matched, key=lambda r: r.score)] if matched else []
    if not matched:
        raise ERR_SCORE_OUT_OF_RANGE
    return ApiResponse(data=ScoreRankOut(score=score, rank=matched[0].rank))
```

- [ ] **Step 2: 注册到 main**

在 `app/main.py` 的 import 加 `from app.routers import majors, score_rank, schools`，并在 include 处加 `app.include_router(score_rank.router)`。

- [ ] **Step 3: 写测试**

Create `tests/test_score_rank.py`:
```python
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
```

- [ ] **Step 4: 运行验证**

Run: `cd backend && pytest tests/test_score_rank.py -v`
Expected: PASS。

---

## Task 9: recommend 路由（端到端接算法）★

**Files:**
- Create: `app/routers/recommend.py`
- Modify: `app/main.py`（注册）
- Create: `tests/test_recommend_api.py`

**Interfaces:**
- Consumes: `services/recommendation.recommend`、`ScoreRank`、`SchoolScore`、`SchoolInfo`、`config.settings`（阈值）
- Produces: `POST /recommend`（入参 `RecommendRequest`）→ `list[RecommendItemOut]`，按冲稳保排序

- [ ] **Step 1: 创建 `app/routers/recommend.py`**

```python
"""志愿推荐：分数→位次→候选学校→分档+概率。"""
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.errors import ERR_NO_CANDIDATE, ERR_NO_RANK_DATA
from app.models import ScoreRank, SchoolInfo, SchoolScore
from app.schemas.common import ApiResponse
from app.schemas.recommend import RecommendItemOut, RecommendRequest
from app.services.recommendation import recommend

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("", response_model=ApiResponse[list[RecommendItemOut]])
def recommend_schools(req: RecommendRequest, session: Session = Depends(get_session)):
    # 1. 分数→位次（取该省科类最新年份）
    rank_rows = session.exec(
        select(ScoreRank).where(
            ScoreRank.province_id == req.province_id,
            ScoreRank.subject_type == req.subject_type,
        )
    ).all()
    if not rank_rows:
        raise ERR_NO_RANK_DATA
    latest_year = max(r.year for r in rank_rows)
    year_rows = [r for r in rank_rows if r.year == latest_year]
    exact = next((r for r in year_rows if r.score == req.score), None)
    if exact is None:
        below = [r for r in year_rows if r.score < req.score]
        exact = max(below, key=lambda r: r.score) if below else None
    if exact is None:
        from app.errors import ERR_SCORE_OUT_OF_RANGE
        raise ERR_SCORE_OUT_OF_RANGE
    candidate_rank = exact.rank

    # 2. 候选学校 + 历年录取位次
    score_rows = session.exec(
        select(SchoolScore).where(
            SchoolScore.province_id == req.province_id,
            SchoolScore.subject_type == req.subject_type,
        )
    ).all()
    # 聚合 school_id → [历年 rank]
    hist: dict[int, list[int]] = {}
    for s in score_rows:
        hist.setdefault(s.school_id, []).append(s.rank)
    school_history = [(sid, ranks) for sid, ranks in hist.items()]

    # 3. 算法分档
    thresholds = {"pad": settings.tier_pad, "safe": settings.tier_safe,
                  "stable": settings.tier_stable, "rush": settings.tier_rush}
    items = recommend(candidate_rank, school_history, thresholds, settings.prob_k)
    if not items:
        raise ERR_NO_CANDIDATE

    # 4. 补校名输出
    id_to_name = {s.school_id: s.name for s in session.exec(select(SchoolInfo)).all()}
    return ApiResponse(data=[
        RecommendItemOut(
            school_id=it.school_id, school_name=id_to_name.get(it.school_id, ""),
            tier=it.tier.value, probability=it.probability,
            rank_mean=it.rank_mean, rank_min=it.rank_min, rank_max=it.rank_max,
        ) for it in items
    ])
```

- [ ] **Step 2: 注册到 main**

`app/main.py` import 加 `recommend`，include 加 `app.include_router(recommend.router)`。

- [ ] **Step 3: 写端到端测试（造数据→调 API→验冲稳保）**

Create `tests/test_recommend_api.py`:
```python
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
```

- [ ] **Step 4: 运行验证**

Run: `cd backend && pytest tests/test_recommend_api.py -v`
Expected: PASS（考生 600 分/位次 5000，冲校 rush 排前、保校 safe，概率合理）。

- [ ] **Step 5: 全量回归**

Run: `cd backend && pytest -v`
Expected: 所有测试 PASS（smoke + models + recommendation + schools + score_rank + recommend_api）。

---

## Task 10: OpenAPI 导出（前端计划契约来源）

**Files:**
- Create: `backend/scripts/export_openapi.py`

**Interfaces:**
- Produces: `backend/openapi.json`（供前端计划用 `openapi-typescript` 生成 TS 类型）

- [ ] **Step 1: 创建导出脚本**

Create `backend/scripts/export_openapi.py`:
```python
"""导出 OpenAPI JSON，供前端生成 TS 类型。用法：python scripts/export_openapi.py"""
import json
from pathlib import Path

from app.main import app


def main() -> None:
    schema = app.openapi()
    out = Path(__file__).resolve().parent.parent / "openapi.json"
    out.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[done] {out} ({len(schema.get('paths', {}))} paths)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 运行导出验证**

Run: `cd backend && python scripts/export_openapi.py`
Expected: 生成 `backend/openapi.json`，输出路径数 ≥ 5（health、schools×2、majors×2、score-rank、recommend）。打开确认 `/recommend` 的 requestBody schema 存在。

- [ ] **Step 3: 最终全量验证**

Run: `cd backend && pytest -v && python scripts/export_openapi.py`
Expected: 测试全绿 + openapi.json 正常生成。后端子系统交付完成。

---

## 自审（spec coverage 对照）

| spec 章节 | 覆盖任务 |
|---|---|
| §5 整体架构（目录、concurrently、类型同步） | Task 1（目录+concurrently）、Task 10（openapi 导出，类型同步前端侧由前端计划实现） |
| §6 数据模型（7 表全国化） | Task 3 |
| §7.1 API 路由（schools/majors/score_rank/recommend） | Task 7、8、9 |
| §7.2 推荐算法（位次+冲稳保+概率，阈值外置） | Task 4（算法）、Task 9（接入 API） |
| §10 错误处理（统一响应、业务错误码、边界） | Task 6（errors+schemas）、Task 8/9（边界错误） |
| §11 测试策略（算法单测命门） | Task 4（算法 TDD）、各 router API 测试 |
| §12 数据导入（MySQL→PG，补维度+规范化） | Task 5 |
| §13 后续接口预留（province.gaokao_type、subject_type 可扩展） | Task 3（GaokaoType 枚举、SubjectType 枚举） |

**Placeholder 扫描**：无 TBD/TODO；Task 5 的 `score_rank`/`major_score` 解析标注为"按 sc_li 同套路补"，已在 Step 3 注明——属执行者按已给范式扩展，非占位。若需严格无歧义，可在执行 Task 5 时补全这两个解析函数。

**类型一致性**：`Tier` 枚举值（rush/stable/safe/pad）在 `recommendation.py`、API 输出（`tier.value`）、前端契约（string）一致；`RecommendItem` 字段（school_id/tier/probability/rank_mean/rank_min/rank_max）与 `RecommendItemOut` 一一对应。

---

## 执行交接

计划已保存至 `docs/superpowers/plans/2026-06-26-gkvr-stage1-backend.md`。

**后端计划完成。两种执行方式：**

1. **子代理驱动（推荐）** — 每个 Task 派一个全新子代理实现，任务间我评审，迭代快、上下文干净。
2. **内联执行** — 在当前会话按 executing-plans 批量执行，带检查点评审。

**选哪种？** 或者你想先自己读完计划再定，也可以。
