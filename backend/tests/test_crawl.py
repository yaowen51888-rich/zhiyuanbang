"""crawl_baidu 纯函数 + upsert + HTTP 层单测（不触网）。"""
import sys
from pathlib import Path

# 把 scripts/ 加入 path 以便 import crawl_baidu（仿 data/test_parse.py 模式）
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import crawl_baidu
from sqlmodel import Session, SQLModel, create_engine, select

import app.models  # noqa: 注册全部模型以建表
from crawl_baidu import (map_curriculum, parse_tags, parse_score_row,
                         upsert_school, upsert_score, PROVINCES,
                         _get, fetch_list, fetch_schoolscore)
from app.models import SchoolInfo, SchoolScore
from app.models.enums import SubjectType


def _mem_session() -> Session:
    """内存 SQLite 会话，供 upsert 测试。"""
    eng = create_engine("sqlite://")
    SQLModel.metadata.create_all(eng)
    return Session(eng)


# ---------- 纯函数 ----------

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


# ---------- upsert / 字典 ----------

def test_provinces_dict_has_sichuan():
    pid, code, gk_type, currs = PROVINCES["四川"]
    assert pid == 51
    assert code == "51"
    assert gk_type == "old"
    assert currs == ["理科", "文科"]


def test_upsert_school_insert_then_reuse():
    """校名自然键：首次插入，再次复用同一 school_id（幂等）。"""
    fields = {"province": "四川", "city": "成都", "is_985": True, "is_211": True,
              "level": "本科", "type": "综合", "nature": "公办"}
    with _mem_session() as s:
        sid1 = upsert_school(s, "测试大学", fields)
        sid2 = upsert_school(s, "测试大学", fields)
        assert sid1 == sid2
        assert s.exec(select(SchoolInfo)).first().school_id == sid1


def test_upsert_school_updates_fields():
    """重跑时可变字段被更新（如标签变化）。"""
    base = {"province": "", "city": "", "is_211": False, "level": "", "type": "", "nature": ""}
    with _mem_session() as s:
        upsert_school(s, "X大学", dict(base, is_985=False))
        upsert_school(s, "X大学", dict(base, is_985=True))
        assert s.exec(select(SchoolInfo)).first().is_985 is True


def test_upsert_score_idempotent():
    """同自然键的 SchoolScore 不重复插入，分数被更新。"""
    row = {"year": 2024, "batch": "本科一批", "score": 645, "rank": 5976}
    with _mem_session() as s:
        upsert_score(s, 1, 51, SubjectType.science, row)
        upsert_score(s, 1, 51, SubjectType.science, dict(row, score=646))
        rows = s.exec(select(SchoolScore)).all()
        assert len(rows) == 1
        assert rows[0].score == 646


# ---------- HTTP 层（mock httpx，不触网）----------

class _FakeResponse:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        if self._payload is None:
            raise ValueError("no json")
        return self._payload


class _FakeClient:
    """按预设序列返回响应、记录调用的假 client。"""
    def __init__(self, responses):
        self._responses = list(responses)
        self.records: list[dict] = []

    def get(self, url, params=None, timeout=None):
        self.records.append({"url": url, "params": params})
        return self._responses.pop(0)


def test_get_retries_on_failure_then_succeeds(monkeypatch):
    """前两次失败（500/异常），后续 200 → 返回解析结果。"""
    monkeypatch.setattr(crawl_baidu.time, "sleep", lambda s: None)
    client = _FakeClient([_FakeResponse(500), _FakeResponse(200, {"data": {"ok": True}})])
    out = _get(client, "http://x", {}, retries=3)
    assert out == {"data": {"ok": True}}


def test_get_returns_none_after_all_retries_fail(monkeypatch):
    monkeypatch.setattr(crawl_baidu.time, "sleep", lambda s: None)
    client = _FakeClient([_FakeResponse(500), _FakeResponse(500), _FakeResponse(500)])
    assert _get(client, "http://x", {}, retries=3) is None


def test_fetch_list_paginates_until_no_next(monkeypatch):
    monkeypatch.setattr(crawl_baidu.time, "sleep", lambda s: None)
    page1 = {"data": {"pageInfo": {"hasNext": True},
                      "ranking": {"tRow": [{"college_name": "A"}, {"college_name": "B"}]}}}
    page2 = {"data": {"pageInfo": {"hasNext": False},
                      "ranking": {"tRow": [{"college_name": "C"}]}}}
    client = _FakeClient([_FakeResponse(200, page1), _FakeResponse(200, page2)])
    rows = fetch_list(client, rate=0)
    assert [r["college_name"] for r in rows] == ["A", "B", "C"]


def test_fetch_schoolscore_extracts_datalist(monkeypatch):
    monkeypatch.setattr(crawl_baidu.time, "sleep", lambda s: None)
    payload = {"data": {"school_score": {"dataList": [
        {"legalName": "X", "minScore": "600", "minScoreOrder": "1000"}]}}}
    client = _FakeClient([_FakeResponse(200, payload)])
    dl = fetch_schoolscore(client, "X", "四川", "理科", 2024, rate=0)
    assert len(dl) == 1 and dl[0]["minScore"] == "600"


def test_fetch_list_retries_empty_page(monkeypatch):
    """百度偶发空 tRow：重试本页，恢复后继续翻页（不丢失后续数据）。"""
    monkeypatch.setattr(crawl_baidu.time, "sleep", lambda s: None)
    empty = {"data": {"pageInfo": {"hasNext": True}, "ranking": {"tRow": []}}}
    full1 = {"data": {"pageInfo": {"hasNext": True},
                      "ranking": {"tRow": [{"college_name": "A"}]}}}
    full2 = {"data": {"pageInfo": {"hasNext": False},
                      "ranking": {"tRow": [{"college_name": "B"}]}}}
    # 序列：空、空、A（恢复）、B（结束）
    client = _FakeClient([_FakeResponse(200, empty), _FakeResponse(200, empty),
                          _FakeResponse(200, full1), _FakeResponse(200, full2)])
    rows = fetch_list(client, rate=0)
    assert [r["college_name"] for r in rows] == ["A", "B"]
