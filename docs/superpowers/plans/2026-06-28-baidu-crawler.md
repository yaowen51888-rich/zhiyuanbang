# 百度高考数据采集脚本 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 写一个采集脚本，从百度高考公开 API 抓真实院校库 + 四川学校录取线（含位次）入 `gkvr.db`，让 `/recommend` 跑在真实数据上。

**Architecture:** 单脚本 `crawl_baidu.py`，分层：纯映射函数 → upsert 持久化 → HTTP 抓取 → 主流程+CLI。复用 `app.db.engine` 与 `seed_dev.py` 同风格入库。schema 扩 `SubjectType` 支持新高考科类（本次仅启用四川文/理）。

**Tech Stack:** Python ≥3.11、SQLModel、httpx（dev 依赖）、SQLite、pytest

## Global Constraints

- **不执行 git 提交/分支操作**（遵循项目 CLAUDE.md："如果用户没有主动要求，绝对不要计划和执行git提交和分支等操作"）。每个任务以测试/验证通过收尾，不 commit。
- Python ≥3.11；`httpx` 已在 `[project.optional-dependencies].dev`，无需新增依赖。
- SQLite（`backend/gkvr.db`），`SubjectType` 存字符串枚举值，加值**无需 DB 迁移**。
- 代码注释中文（与现有 `seed_dev.py` / `import_mysql_to_pg.py` 一致）。
- 尊重百度频控：默认请求间隔 1s（`--rate`），指数退避重试。
- 数据源匿名访问，UA + Referer 即可（已实测）。
- 试点仅四川（文 + 理），年份 2020–2024。

---

### Task 1: 扩展 SubjectType 枚举

**Files:**
- Modify: `backend/app/models/enums.py`
- Test: `backend/tests/test_enums.py`（新增）

**Interfaces:**
- Produces: `SubjectType.physics`、`SubjectType.history`、`SubjectType.comprehensive`（供 Task 2+ 的 `CURRICULUM_MAP` 引用）

- [ ] **Step 1: 写失败测试**

创建 `backend/tests/test_enums.py`：

```python
"""SubjectType 枚举值测试。"""
from app.models.enums import SubjectType


def test_subject_type_has_new_gaokao_values():
    """新高考科类值存在且字符串值稳定（DB 存的是字符串）。"""
    assert SubjectType.physics.value == "physics"
    assert SubjectType.history.value == "history"
    assert SubjectType.comprehensive.value == "comprehensive"


def test_subject_type_keeps_old_values():
    """老高考文/理值不变（向后兼容）。"""
    assert SubjectType.science.value == "science"
    assert SubjectType.liberal.value == "liberal"
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && python -m pytest tests/test_enums.py -v`
Expected: FAIL — `AttributeError: physics is not a valid SubjectType`

- [ ] **Step 3: 实现枚举扩展**

修改 `backend/app/models/enums.py`，将 `SubjectType` 改为：

```python
class SubjectType(str, Enum):
    liberal = "liberal"           # 文科（老高考）
    science = "science"           # 理科（老高考）
    physics = "physics"           # 物理类（新高考 3+1+2）
    history = "history"           # 历史类（新高考 3+1+2）
    comprehensive = "comprehensive"  # 综合（新高考 3+3）
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd backend && python -m pytest tests/test_enums.py -v`
Expected: PASS（2 passed）

- [ ] **Step 5: 回归——确认现有测试与导入不受影响**

Run: `cd backend && python -m pytest -q`
Expected: 全绿（现有 seed/parse 测试不受影响，仅新增枚举值）

---

### Task 2: crawl_baidu.py 骨架 + 纯映射函数

**Files:**
- Create: `backend/scripts/crawl_baidu.py`
- Create: `backend/tests/test_crawl.py`

**Interfaces:**
- Produces:
  - `map_curriculum(raw: str) -> SubjectType | None`
  - `parse_tags(tags: list[str]) -> dict`（返回 `{"is_985": bool, "is_211": bool}`）
  - `parse_score_row(row: dict) -> dict | None`（返回 `{"year": int, "batch": str, "score": int, "rank": int}` 或 `None`）

- [ ] **Step 1: 写失败测试**

创建 `backend/tests/test_crawl.py`：

```python
"""crawl_baidu 纯函数单测（不触网）。"""
import sys
from pathlib import Path

# 把 scripts/ 加入 path 以便 import crawl_baidu（仿 data/test_parse.py 模式）
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from crawl_baidu import map_curriculum, parse_tags, parse_score_row
from app.models.enums import SubjectType


def test_map_curriculum_old_gaokao():
    assert map_curriculum("理科") is SubjectType.science
    assert map_curriculum("文科") is SubjectType.liberal


def test_map_curriculum_new_gaokao():
    assert map_curriculum("物理类") is SubjectType.physics
    assert map_curriculum("历史类") is SubjectType.history
    assert map_curriculum("综合") is SubjectType.comprehensive
    assert map_curriculum("3+3综合") is SubjectType.comprehensive


def test_map_curriculum_unknown_returns_none():
    assert map_curriculum("某某科") is None
    assert map_curriculum("") is None
    assert map_curriculum(None) is None


def test_parse_tags_extracts_985_211():
    assert parse_tags(["双一流", "985", "211", "强基计划"]) == {"is_985": True, "is_211": True}
    assert parse_tags(["双一流"]) == {"is_985": False, "is_211": False}
    assert parse_tags([]) == {"is_985": False, "is_211": False}


def test_parse_score_row_valid():
    row = {"year": "2024", "batchName": "本科一批",
           "minScore": "645", "minScoreOrder": "5976"}
    assert parse_score_row(row) == {"year": 2024, "batch": "本科一批",
                                    "score": 645, "rank": 5976}


def test_parse_score_row_drops_missing_rank():
    """位次是算法命脉，缺失/非数字则弃整行。"""
    assert parse_score_row({"year": "2024", "batchName": "x",
                            "minScore": "645", "minScoreOrder": "-"}) is None
    assert parse_score_row({"year": "2024", "batchName": "x",
                            "minScore": "", "minScoreOrder": "100"}) is None


def test_parse_score_row_drops_bad_year():
    assert parse_score_row({"year": "", "batchName": "x",
                            "minScore": "600", "minScoreOrder": "1000"}) is None
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'crawl_baidu'`

- [ ] **Step 3: 写 crawl_baidu.py 骨架 + 三个纯函数**

创建 `backend/scripts/crawl_baidu.py`：

```python
"""采集百度高考真实数据入库 gkvr.db（试点：四川）。

数据源：gaokao.baidu.com 公开 API（匿名 + UA + Referer）。
- list: 全国院校库 → SchoolInfo / SchoolDetail
- schoolscore: 学校录取线 + 位次 → SchoolScore（按 --provinces 指定省）

用法：
  python scripts/crawl_baidu.py                        # 默认采四川(文+理, 2020-2024)
  python scripts/crawl_baidu.py --schools-only         # 只刷院校库
  python scripts/crawl_baidu.py --fresh                # 先清空校/线(保留 ScoreRank)
  python scripts/crawl_baidu.py --top 200              # 只采排名前 200 校(试点缩减)
  python scripts/crawl_baidu.py --provinces 四川,重庆
  python scripts/crawl_baidu.py --years 2023,2024

幂等：校名自然键 upsert，重跑不重复插入。
"""
import sys
import time
from pathlib import Path

# 把 backend/ 加入 path 以便 import app（与 seed_dev.py 同处理）
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.models.enums import SubjectType

BASE = "https://gaokao.baidu.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
HEADERS = {"User-Agent": UA, "Referer": f"{BASE}/"}
DEFAULT_YEARS = [2024, 2023, 2022, 2021, 2020]

# 百度科类串 → SubjectType
CURRICULUM_MAP = {
    "理科": SubjectType.science, "理": SubjectType.science,
    "文科": SubjectType.liberal, "文": SubjectType.liberal,
    "物理": SubjectType.physics, "物理类": SubjectType.physics,
    "物理科目组合": SubjectType.physics,
    "历史": SubjectType.history, "历史类": SubjectType.history,
    "历史科目组合": SubjectType.history,
    "综合": SubjectType.comprehensive, "3+3综合": SubjectType.comprehensive,
    "文理综合": SubjectType.comprehensive,
}


def map_curriculum(raw: str) -> SubjectType | None:
    """百度科类串 → SubjectType，无法识别返回 None。"""
    if not raw:
        return None
    return CURRICULUM_MAP.get(str(raw).strip())


def parse_tags(tags: list[str]) -> dict:
    """百度 tag 列表 → {is_985, is_211}。"""
    tags = tags or []
    return {"is_985": "985" in tags, "is_211": "211" in tags}


def _to_int(s) -> int | None:
    """字符串 → int，空/失败 → None。"""
    try:
        return int(str(s).strip())
    except (TypeError, ValueError):
        return None


def parse_score_row(row: dict) -> dict | None:
    """schoolscore dataList 单行 → SchoolScore 字段；无效行返回 None。

    rank（录取位次）是推荐算法命脉，缺失则整行弃。
    """
    score = _to_int(row.get("minScore"))
    rank = _to_int(row.get("minScoreOrder"))
    year = _to_int(row.get("year"))
    if score is None or rank is None or year is None:
        return None
    return {"year": year, "batch": (row.get("batchName") or "").strip(),
            "score": score, "rank": rank}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: PASS（7 passed）

---

### Task 3: PROVINCES 字典 + upsert 持久化函数

**Files:**
- Modify: `backend/scripts/crawl_baidu.py`
- Modify: `backend/tests/test_crawl.py`

**Interfaces:**
- Produces:
  - `PROVINCES: dict[str, tuple[int, str, str, list[str]]]`（省名 → province_id, code, gaokao_type, [curriculums]）
  - `upsert_school(session: Session, name: str, fields: dict) -> int`（返回 school_id）
  - `upsert_score(session, school_id: int, province_id: int, subject_type: SubjectType, row: dict) -> None`
  - `ensure_province(session, province_id, name, code, gk_type) -> None`

- [ ] **Step 1: 写失败测试（追加到 test_crawl.py）**

在 `backend/tests/test_crawl.py` 顶部追加 import：

```python
from sqlmodel import Session, SQLModel, create_engine, select
import app.models  # noqa: 注册全部模型以建表
from crawl_baidu import upsert_school, upsert_score, PROVINCES
from app.models import SchoolInfo, SchoolScore
from app.models.enums import SubjectType


def _mem_session() -> Session:
    """内存 SQLite 会话，供 upsert 测试。"""
    eng = create_engine("sqlite://")
    SQLModel.metadata.create_all(eng)
    return Session(eng)
```

追加测试函数：

```python
def test_provinces_dict_has_sichuan():
    pid, code, gk_type, currs = PROVINCES["四川"]
    assert pid == 51
    assert code == "51"
    assert gk_type == "old"
    assert currs == ["理科", "文科"]


def test_upsert_school_insert_then_reuse():
    """校名自然键：首次插入，再次复用同一 school_id（幂等）。"""
    with _mem_session() as s:
        sid1 = upsert_school(s, "测试大学", {"province": "四川", "city": "成都",
                                              "is_985": True, "is_211": True,
                                              "level": "本科", "type": "综合",
                                              "nature": "公办"})
        sid2 = upsert_school(s, "测试大学", {"province": "四川", "city": "成都",
                                              "is_985": True, "is_211": True,
                                              "level": "本科", "type": "综合",
                                              "nature": "公办"})
        assert sid1 == sid2
        assert s.exec(select(SchoolInfo)).first().school_id == sid1


def test_upsert_school_updates_fields():
    """重跑时可变字段被更新（如标签变化）。"""
    with _mem_session() as s:
        upsert_school(s, "X大学", {"province": "", "city": "", "is_985": False,
                                   "is_211": False, "level": "", "type": "",
                                   "nature": ""})
        upsert_school(s, "X大学", {"province": "", "city": "", "is_985": True,
                                   "is_211": False, "level": "", "type": "",
                                   "nature": ""})
        assert s.exec(select(SchoolInfo)).first().is_985 is True


def test_upsert_score_idempotent():
    """同自然键的 SchoolScore 不重复插入，分数被更新。"""
    row = {"year": 2024, "batch": "本科一批", "score": 645, "rank": 5976}
    with _mem_session() as s:
        upsert_score(s, 1, 51, SubjectType.science, row)
        row2 = dict(row, score=646)
        upsert_score(s, 1, 51, SubjectType.science, row2)
        rows = s.exec(select(SchoolScore)).all()
        assert len(rows) == 1
        assert rows[0].score == 646
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: FAIL — `ImportError: cannot import name 'upsert_school'`

- [ ] **Step 3: 实现 PROVINCES 字典 + upsert 函数**

在 `backend/scripts/crawl_baidu.py` 顶部 import 区追加（`from app.models.enums import SubjectType` 之后）：

```python
from sqlmodel import Session, select

from app.models import SchoolInfo, SchoolScore
```

在 `parse_score_row` 函数之后追加：

```python
# 省份字典：省名 → (province_id, code, gaokao_type, [curriculums])
# province_id 取国标 GB/T 2260 前 2 位；gaokao_type: old / new_3_3 / new_3_1_2
PROVINCES = {
    "北京": (11, "11", "new_3_3", ["综合"]),
    "天津": (12, "12", "new_3_3", ["综合"]),
    "河北": (13, "13", "new_3_1_2", ["物理类", "历史类"]),
    "山西": (14, "14", "old", ["理科", "文科"]),
    "内蒙古": (15, "15", "new_3_1_2", ["物理类", "历史类"]),
    "辽宁": (21, "21", "new_3_1_2", ["物理类", "历史类"]),
    "吉林": (22, "22", "new_3_1_2", ["物理类", "历史类"]),
    "黑龙江": (23, "23", "new_3_1_2", ["物理类", "历史类"]),
    "上海": (31, "31", "new_3_3", ["综合"]),
    "江苏": (32, "32", "new_3_1_2", ["物理类", "历史类"]),
    "浙江": (33, "33", "new_3_3", ["综合"]),
    "安徽": (34, "34", "new_3_1_2", ["物理类", "历史类"]),
    "福建": (35, "35", "new_3_1_2", ["物理类", "历史类"]),
    "江西": (36, "36", "new_3_1_2", ["物理类", "历史类"]),
    "山东": (37, "37", "new_3_3", ["综合"]),
    "河南": (41, "41", "old", ["理科", "文科"]),
    "湖北": (42, "42", "new_3_1_2", ["物理类", "历史类"]),
    "湖南": (43, "43", "new_3_1_2", ["物理类", "历史类"]),
    "广东": (44, "44", "new_3_1_2", ["物理类", "历史类"]),
    "广西": (45, "45", "new_3_1_2", ["物理类", "历史类"]),
    "海南": (46, "46", "new_3_3", ["综合"]),
    "重庆": (50, "50", "new_3_1_2", ["物理类", "历史类"]),
    "四川": (51, "51", "old", ["理科", "文科"]),
    "贵州": (52, "52", "old", ["理科", "文科"]),
    "云南": (53, "53", "old", ["理科", "文科"]),
    "西藏": (54, "54", "old", ["理科", "文科"]),
    "陕西": (61, "61", "old", ["理科", "文科"]),
    "甘肃": (62, "62", "new_3_1_2", ["物理类", "历史类"]),
    "青海": (63, "63", "old", ["理科", "文科"]),
    "宁夏": (64, "64", "old", ["理科", "文科"]),
    "新疆": (65, "65", "old", ["理科", "文科"]),
}


def ensure_province(session: Session, province_id: int, name: str,
                    code: str, gk_type: str) -> None:
    """省份不存在则插入（gaokao_type 字符串 → 枚举）。"""
    from app.models import Province
    from app.models.province import GaokaoType
    if not session.get(Province, province_id):
        session.add(Province(province_id=province_id, name=name, code=code,
                             gaokao_type=GaokaoType(gk_type)))


def upsert_school(session: Session, name: str, fields: dict) -> int:
    """校名自然键：存在复用 school_id 并更新字段，不存在则插入。返回 school_id。"""
    existing = session.exec(select(SchoolInfo).where(SchoolInfo.name == name)).first()
    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        session.add(existing)
        session.flush()
        return existing.school_id
    obj = SchoolInfo(name=name, **fields)
    session.add(obj)
    session.flush()
    return obj.school_id


def upsert_score(session: Session, school_id: int, province_id: int,
                 subject_type: SubjectType, row: dict) -> None:
    """SchoolScore 按 (school, province, subject_type, year, batch) 去重 upsert。"""
    existing = session.exec(select(SchoolScore).where(
        SchoolScore.school_id == school_id,
        SchoolScore.province_id == province_id,
        SchoolScore.subject_type == subject_type,
        SchoolScore.year == row["year"],
        SchoolScore.batch == row["batch"],
    )).first()
    if existing:
        existing.score = row["score"]
        existing.rank = row["rank"]
        session.add(existing)
    else:
        session.add(SchoolScore(school_id=school_id, province_id=province_id,
                                subject_type=subject_type, year=row["year"],
                                batch=row["batch"], score=row["score"],
                                rank=row["rank"]))
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: PASS（全部，含新增 4 个）

---

### Task 4: HTTP 抓取层（带重试 + 翻页）

**Files:**
- Modify: `backend/scripts/crawl_baidu.py`
- Modify: `backend/tests/test_crawl.py`

**Interfaces:**
- Produces:
  - `_get(client: httpx.Client, url: str, params: dict, retries: int = 3) -> dict | None`
  - `fetch_list(client: httpx.Client, rate: float) -> list[dict]`（返回 `ranking.tRow` 列表）
  - `fetch_schoolscore(client, school, province, curriculum, year, rate) -> list[dict]`（返回 dataList）

- [ ] **Step 1: 写失败测试（mock httpx，不触网）**

在 `backend/tests/test_crawl.py` 顶部追加 import：

```python
import httpx
from crawl_baidu import _get, fetch_list, fetch_schoolscore
```

追加测试函数：

```python
class _FakeResponse:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload
    def json(self):
        if self._payload is None:
            raise ValueError("no json")
        return self._payload


class _FakeClient:
    """记录调用、按预设序列返回响应的假 client。"""
    def __init__(self, responses, records=None):
        self._responses = list(responses)
        self.records = records if records is not None else []
    def get(self, url, params=None, timeout=None):
        self.records.append({"url": url, "params": params})
        return self._responses.pop(0)


def test_get_retries_on_failure_then_succeeds(monkeypatch):
    """前两次失败（500/异常），第三次 200 → 返回解析结果。"""
    calls = {"sleep": 0}
    monkeypatch.setattr("crawl_baidu.time.sleep", lambda s: calls.__setitem__("sleep", calls["sleep"] + 1))
    client = _FakeClient([
        _FakeResponse(500),
        _FakeResponse(200, {"data": {"ok": True}}),
    ])
    out = _get(client, "http://x", {}, retries=3)
    assert out == {"data": {"ok": True}}
    assert calls["sleep"] >= 1  # 重试间有退避


def test_get_returns_none_after_all_retries_fail(monkeypatch):
    monkeypatch.setattr("crawl_baidu.time.sleep", lambda s: None)
    client = _FakeClient([_FakeResponse(500), _FakeResponse(500), _FakeResponse(500)])
    assert _get(client, "http://x", {}, retries=3) is None


def test_fetch_list_paginates_until_no_next(monkeypatch):
    monkeypatch.setattr("crawl_baidu.time.sleep", lambda s: None)
    page1 = {"data": {"ranking": {"tRow": [{"college_name": "A"}, {"college_name": "B"}],
                                  "pageInfo": {"hasNext": True}}}}
    page2 = {"data": {"ranking": {"tRow": [{"college_name": "C"}],
                                  "pageInfo": {"hasNext": False}}}}
    client = _FakeClient([_FakeResponse(200, page1), _FakeResponse(200, page2)])
    rows = fetch_list(client, rate=0)
    assert [r["college_name"] for r in rows] == ["A", "B", "C"]


def test_fetch_schoolscore_extracts_datalist(monkeypatch):
    monkeypatch.setattr("crawl_baidu.time.sleep", lambda s: None)
    payload = {"data": {"school_score": {"dataList": [
        {"legalName": "X", "minScore": "600", "minScoreOrder": "1000"}]}}}
    client = _FakeClient([_FakeResponse(200, payload)])
    dl = fetch_schoolscore(client, "X", "四川", "理科", 2024, rate=0)
    assert len(dl) == 1 and dl[0]["minScore"] == "600"
```

> 注：`_get` 内部用 `time.sleep`，测试用 monkeypatch 打桩避免真实等待。

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: FAIL — `ImportError: cannot import name '_get'`

- [ ] **Step 3: 实现 HTTP 抓取层**

在 `backend/scripts/crawl_baidu.py` 顶部 import 区追加：

```python
import httpx
```

在 `upsert_score` 之后追加：

```python
def _get(client: httpx.Client, url: str, params: dict, retries: int = 3) -> dict | None:
    """带指数退避重试的 GET；彻底失败返回 None。"""
    for attempt in range(retries):
        try:
            r = client.get(url, params=params, timeout=20)
            if r.status_code == 200:
                return r.json()
        except (httpx.HTTPError, ValueError):
            pass
        time.sleep(1.5 ** attempt)
    return None


def fetch_list(client: httpx.Client, rate: float) -> list[dict]:
    """翻页拉全国院校清单，返回 ranking.tRow 列表。"""
    rows, pn, page_size = [], 1, 50
    while True:
        data = _get(client, f"{BASE}/gk/gkschool/list", {"rn": page_size, "pn": pn})
        if not data:
            break
        ranking = data.get("data", {}).get("ranking", {})
        trow = ranking.get("tRow", [])
        if not trow:
            break
        rows.extend(trow)
        if not ranking.get("pageInfo", {}).get("hasNext"):
            break
        pn += 1
        time.sleep(rate)
    return rows


def fetch_schoolscore(client: httpx.Client, school: str, province: str,
                      curriculum: str, year: int, rate: float) -> list[dict]:
    """单次查某校某省某科类某年分数线，返回 dataList。"""
    data = _get(client, f"{BASE}/gk/gkschool/schoolscore", {
        "school": school, "province": province,
        "curriculum": curriculum, "year": year,
    })
    if not data:
        return []
    return data.get("data", {}).get("school_score", {}).get("dataList", []) or []
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd backend && python -m pytest tests/test_crawl.py -v`
Expected: PASS（全部，含新增 4 个 mock 测试）

---

### Task 5: 主流程 crawl + --fresh + CLI

**Files:**
- Modify: `backend/scripts/crawl_baidu.py`

**Interfaces:**
- Produces:
  - `crawl(provinces: list[str], years: list[int], fresh: bool, schools_only: bool, top: int | None, rate: float) -> None`
  - `main() -> None`（argparse 入口）

- [ ] **Step 1: 实现 crawl / _fresh / main**

在 `backend/scripts/crawl_baidu.py` 顶部 import 区调整——追加：

```python
import argparse
from sqlmodel import delete, SQLModel

from app.db import engine
from app.models import SchoolDetail
import app.models  # noqa: 确保全部模型注册以建表
```

> 说明：`import app.models` 放 import 区会在模块加载时执行（仅注册模型，不连库不触网，安全）。

在文件末尾追加：

```python
def _fresh(session: Session) -> None:
    """清空校/详情/线，保留 ScoreRank（一分一段表用 seed 顶）。"""
    for m in (SchoolScore, SchoolDetail, SchoolInfo):
        session.exec(delete(m))
    session.commit()


def crawl(provinces: list[str], years: list[int], fresh: bool,
          schools_only: bool, top: int | None, rate: float) -> None:
    """主流程：先采全国院校库，再按省采录取线。"""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s, httpx.Client(headers=HEADERS) as client:
        if fresh:
            _fresh(s)

        # 1) 全国院校库 → SchoolInfo / SchoolDetail
        print("[1/2] 拉取全国院校库...")
        rows = fetch_list(client, rate)
        if top:
            rows = rows[:top]
        name_to_id: dict[str, int] = {}
        for i, r in enumerate(rows, 1):
            name = (r.get("college_name") or "").strip()
            if not name:
                continue
            tags = parse_tags(r.get("tag", []))
            sid = upsert_school(s, name, {
                "province": r.get("province", ""), "city": r.get("city", ""),
                "is_985": tags["is_985"], "is_211": tags["is_211"],
                "level": r.get("education", ""), "type": r.get("school_type", ""),
                "nature": r.get("nature", ""),
            })
            # SchoolDetail：list 无简介，留空（后续可从 schoolhome 补）
            if not s.get(SchoolDetail, sid):
                s.add(SchoolDetail(school_id=sid, intro=""))
            name_to_id[name] = sid
            if i % 50 == 0:
                print(f"  院校 {i}/{len(rows)}")
                s.commit()
        s.commit()
        print(f"[done] 院校库 {len(name_to_id)} 所")

        if schools_only:
            return

        # 2) 各省录取线 → SchoolScore
        for prov in provinces:
            if prov not in PROVINCES:
                print(f"[skip] 未知省份 {prov}", file=sys.stderr)
                continue
            pid, code, gk_type, curriculums = PROVINCES[prov]
            ensure_province(s, pid, prov, code, gk_type)
            s.commit()
            print(f"[2/2] 采集 {prov} 录取线（{len(name_to_id)} 校 × {curriculums} × {years}）...")
            done = 0
            for name, sid in name_to_id.items():
                for curr in curriculums:
                    st = map_curriculum(curr)
                    if st is None:
                        continue
                    for year in years:
                        for r in fetch_schoolscore(client, name, prov, curr, year, rate):
                            parsed = parse_score_row(r)
                            if parsed:
                                upsert_score(s, sid, pid, st, parsed)
                        time.sleep(rate)
                s.commit()
                done += 1
                if done % 50 == 0:
                    print(f"  {prov} {done}/{len(name_to_id)} 校")
            print(f"[done] {prov} 采集完成")


def main() -> None:
    p = argparse.ArgumentParser(description="采集百度高考数据入 gkvr.db")
    p.add_argument("--provinces", default="四川", help="逗号分隔省名，默认四川")
    p.add_argument("--years", default=",".join(map(str, DEFAULT_YEARS)),
                   help="逗号分隔年份，默认 2024-2020")
    p.add_argument("--fresh", action="store_true", help="先清空校/线（保留 ScoreRank）")
    p.add_argument("--schools-only", action="store_true", help="只刷院校库不采分数线")
    p.add_argument("--top", type=int, default=None, help="只采排名前 N 校（试点缩减）")
    p.add_argument("--rate", type=float, default=1.0, help="每次请求间隔秒，默认 1.0")
    a = p.parse_args()
    crawl(
        provinces=[x.strip() for x in a.provinces.split(",") if x.strip()],
        years=[int(y) for y in a.years.split(",") if y.strip()],
        fresh=a.fresh, schools_only=a.schools_only, top=a.top, rate=a.rate,
    )


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 静态自检——import 无误、语法正确**

Run: `cd backend && python -c "import sys; sys.path.insert(0,'scripts'); import crawl_baidu; print('import ok')"`
Expected: 输出 `import ok`（无异常）

- [ ] **Step 3: 回归——全部单测仍绿**

Run: `cd backend && python -m pytest -q`
Expected: 全绿（新增 HTTP/upsert/纯函数测试 + 现有测试）

- [ ] **Step 4: 真实小样本端到端——只刷院校库**

Run: `cd backend && python scripts/crawl_baidu.py --schools-only --rate 0.5`
Expected: 输出 `[done] 院校库 N 所`（N ≈ 3000+），`gkvr.db` 的 `schoolinfo` 表行数 ≈ 3000

验证行数：
```bash
cd backend && python -c "import sqlite3; print(sqlite3.connect('gkvr.db').execute('SELECT COUNT(*) FROM schoolinfo').fetchone()[0])"
```
Expected: ≈ 3000+

---

### Task 6: 端到端验证（四川小样本 + /recommend）

**Files:** 无代码改动，仅运行验证

**Interfaces:** 无

- [ ] **Step 1: --fresh 清空旧 seed 校/线（保留 ScoreRank）**

Run: `cd backend && python scripts/crawl_baidu.py --schools-only --fresh --rate 0.5`
Expected: `[done] 院校库 N 所`；`schoolinfo` 行数 ≈ 3000，`scorerank` 行数仍为 12（seed 保留）

验证：
```bash
cd backend && python -c "import sqlite3;c=sqlite3.connect('gkvr.db');print('schools',c.execute('SELECT COUNT(*) FROM schoolinfo').fetchone()[0]);print('scorerank',c.execute('SELECT COUNT(*) FROM scorerank').fetchone()[0])"
```
Expected: `schools ≈3000`，`scorerank 12`

- [ ] **Step 2: 小样本采集四川录取线（限 5 校，验证全链路）**

Run: `cd backend && python scripts/crawl_baidu.py --top 5 --provinces 四川 --years 2024,2023 --rate 1.0`
Expected: 输出 `[done] 四川 采集完成`；`schoolscore` 表有真实数据

验证：
```bash
cd backend && python -c "import sqlite3;c=sqlite3.connect('gkvr.db');print('rows',c.execute('SELECT COUNT(*) FROM schoolscore').fetchone()[0]);[print(r) for r in c.execute('SELECT s.name,sc.year,sc.batch,sc.score,sc.rank FROM schoolscore sc JOIN schoolinfo s ON s.school_id=sc.school_id LIMIT 5').fetchall()]"
```
Expected: `rows > 0`，列出如 `(北京大学, 2024, 本科一批, 6xx, xxxx)` 的真实分数线 + 位次

- [ ] **Step 3: 启动后端，POST /recommend 用真实数据验证**

启动（后台）：
```bash
cd backend && python -m uvicorn app.main:app --port 8000 &
```

等待 ~3s 后调用（四川理科 600 分；ScoreRank 用 seed，需 seed 里有 600 分对应位次）：
```bash
curl -s -X POST http://localhost:8000/recommend -H "Content-Type: application/json" -d '{"province_id":51,"subject_type":"science","score":600}'
```
Expected: 返回 `{"code":0,"data":[...]}`，`data` 含真实院校的 `school_name`、`tier`、`probability`、`rank_mean` 等（不再是 seed 的 8 所假校）

> 若返回 `ERR_NO_RANK_DATA`：seed 的 ScoreRank 表里 province_id=51 缺数据，先跑 `python scripts/seed_dev.py` 重建 ScoreRank 再试。

- [ ] **Step 4: 幂等验证——重跑不翻倍**

Run: `cd backend && python scripts/crawl_baidu.py --top 5 --provinces 四川 --years 2024,2023 --rate 1.0`（再跑一次）
验证 `schoolscore` 行数与 Step 2 相同（upsert 去重生效）。

- [ ] **Step 5: 关停后端**

```bash
kill %1 2>/dev/null || true
```

---

## Self-Review 结论

- **Spec 覆盖**：schema 扩展(Task1)、院校库采集(Task5)、四川录取线(Task5/6)、参数化(Task5 CLI)、全链路验证(Task6)、纯函数单测(Task2-4)、幂等(Task3/6)、--fresh(Task5/6)、限速重试(Task4)——均覆盖。专业线/省控线/一分一段表采集为明确的非目标，不实现。✓
- **占位扫描**：无 TBD/TODO，每步含完整代码或确切命令。✓
- **类型一致**：`map_curriculum`/`parse_tags`/`parse_score_row`/`upsert_school`/`upsert_score`/`_get`/`fetch_list`/`fetch_schoolscore`/`crawl` 签名在定义处与测试处一致；`PROVINCES["四川"] == (51,"51","old",["理科","文科"])` 与 `test_provinces_dict_has_sichuan` 一致。✓
