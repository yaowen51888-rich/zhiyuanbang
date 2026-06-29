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

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx
from sqlmodel import Session, SQLModel, delete, select

import app.models  # noqa: 确保全部模型注册以建表
from app.db import engine
from app.models import CrawlProgress, SchoolDetail, SchoolInfo, SchoolScore
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


def _get(client: httpx.Client, url: str, params: dict, retries: int = 5) -> dict | None:
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


def fetch_list(client: httpx.Client, rate: float, limit: int | None = None) -> list[dict]:
    """翻页拉全国院校清单，返回 ranking.tRow 列表。limit 提前终止（省请求）。

    百度偶发返回空 tRow（反爬/抖动），遇空重试本页，连续 3 次空才放弃。
    """
    rows, pn, page_size = [], 1, 10  # 百度 list 强制 rn=10，传更大值无效
    empty_retries = 0
    while True:
        data = _get(client, f"{BASE}/gk/gkschool/list", {"rn": page_size, "pn": pn})
        if not data:
            break
        d = data.get("data", {})
        trow = d.get("ranking", {}).get("tRow", [])
        if not trow:
            empty_retries += 1
            if empty_retries >= 5:
                break
            time.sleep(rate * empty_retries)
            continue  # 重试本页，不前进 pn
        empty_retries = 0
        rows.extend(trow)
        if limit and len(rows) >= limit:
            return rows[:limit]
        if not d.get("pageInfo", {}).get("hasNext"):
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


def fetch_one_school(client: httpx.Client, name: str, curriculums: list[str],
                     province: str, years: list[int], rate: float) -> list[tuple]:
    """并发任务：采一校所有科类×年份分数线（纯 HTTP，线程安全）。

    返回 [(SubjectType, row_dict)]；写库由主线程串行执行，规避 SQLite 并发写。
    """
    out: list[tuple] = []
    for curr in curriculums:
        st = map_curriculum(curr)
        if st is None:
            continue
        for year in years:
            for r in fetch_schoolscore(client, name, province, curr, year, rate):
                parsed = parse_score_row(r)
                if parsed:
                    out.append((st, parsed))
            time.sleep(rate)  # 每 worker 内限流，控制总 QPS
    return out


def _fresh(session: Session) -> None:
    """清空校/详情/线，保留 ScoreRank（一分一段表用 seed 顶）。"""
    for m in (SchoolScore, SchoolDetail, SchoolInfo, CrawlProgress):
        session.exec(delete(m))
    session.commit()


def crawl(provinces: list[str], years: list[int], fresh: bool,
          schools_only: bool, top: int | None, rate: float,
          max_schools: int | None = None, level: str = "本科",
          workers: int = 5) -> None:
    """主流程：先采全国院校库，再按省采录取线。"""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s, httpx.Client(headers=HEADERS) as client:
        if fresh:
            _fresh(s)

        # 1) 院校库：续采时复用 DB（省翻页 + 不受 list 偶发空页影响）
        name_to_id: dict[str, int] = {}
        if not fresh and not top:
            db_rows = s.exec(select(SchoolInfo.school_id, SchoolInfo.name)).all()
            if db_rows:
                name_to_id = {nm: sid for sid, nm in db_rows}
                print(f"[1/2] 复用 DB 院校库 {len(name_to_id)} 所")
        if not name_to_id:
            print("[1/2] 拉取全国院校库...")
            rows = fetch_list(client, rate, limit=top)
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

        # 按层次粗筛：默认只采本科（专科跨省招生极少，砍掉近半请求）
        if level != "all":
            valid = set(s.exec(select(SchoolInfo.school_id).where(
                SchoolInfo.level == level)).all())
            name_to_id = {n: sid for n, sid in name_to_id.items() if sid in valid}
            print(f"[filter] 层次={level}，剩余 {len(name_to_id)} 校")

        if schools_only:
            return

        # 2) 各省录取线 → SchoolScore（并发采 HTTP，串行写 DB；断点续传跳过已采校）
        for prov in provinces:
            if prov not in PROVINCES:
                print(f"[skip] 未知省份 {prov}", file=sys.stderr)
                continue
            pid, code, gk_type, curriculums = PROVINCES[prov]
            ensure_province(s, pid, prov, code, gk_type)
            s.commit()
            done_sids = set() if fresh else set(
                s.exec(select(CrawlProgress.school_id).where(
                    CrawlProgress.province_id == pid)).all())
            todo = [(n, sid) for n, sid in name_to_id.items() if sid not in done_sids]
            if max_schools:
                todo = todo[:max_schools]
            print(f"[2/2] 采集 {prov}：本批 {len(todo)} 校（省剩余 {len(name_to_id) - len(done_sids)}"
                  f"，已采 {len(done_sids)}）× {curriculums} × {years} | 并发 {workers}")
            done = 0
            with ThreadPoolExecutor(max_workers=workers) as ex:
                futs = {ex.submit(fetch_one_school, client, n, curriculums,
                                  prov, years, rate): (n, sid) for n, sid in todo}
                for fut in as_completed(futs):
                    n, sid = futs[fut]
                    try:
                        rows = fut.result()
                    except Exception as e:  # 单校失败不阻断整批
                        print(f"  [err] {n}: {e}", file=sys.stderr)
                        rows = []
                    with Session(engine) as ws:  # 写库串行（SQLite 单写安全）
                        for st, row in rows:
                            upsert_score(ws, sid, pid, st, row)
                        if not ws.get(CrawlProgress, (pid, sid)):
                            ws.add(CrawlProgress(province_id=pid, school_id=sid))
                        ws.commit()
                    done += 1
                    if done % 50 == 0:
                        print(f"  {prov} {done}/{len(todo)} 校")
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
    p.add_argument("--max-schools", type=int, default=None, help="每批最多采 N 校（小批量，适应中断）")
    p.add_argument("--level", default="本科",
                   help="层次粗筛：本科/专科/all，默认本科（砍掉跨省招生极少的专科）")
    p.add_argument("--workers", type=int, default=5, help="并发线程数，默认 5")
    a = p.parse_args()
    crawl(
        provinces=[x.strip() for x in a.provinces.split(",") if x.strip()],
        years=[int(y) for y in a.years.split(",") if y.strip()],
        fresh=a.fresh, schools_only=a.schools_only, top=a.top, rate=a.rate,
        max_schools=a.max_schools, level=a.level, workers=a.workers,
    )


if __name__ == "__main__":
    main()
