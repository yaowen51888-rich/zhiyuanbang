"""一次性导出：从本地 gkvr.db 抽全量业务数据 → seed_full.json + seed_full.json.gz。

运行：cd backend && python scripts/export_seed_full.py
产物 seed_full.json.gz 由维护者上传 GitHub Release，供 fetch_data.py 下载、
seed_dev.py 灌入 PG/SQLite（见 README「数据发布流程」）。

范围（4 张业务表，排除运行时/空表）：
  province + schoolinfo + schooldetail + schoolscore
不导 crawlprogress（爬虫运行时产物）、scorerank/majorinfo/majorscore（本地几乎无数据）。
"""
import datetime as dt
import gzip
import json
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "gkvr.db"
OUT_JSON = Path(__file__).resolve().parent / "seed_full.json"
OUT_GZ = OUT_JSON.with_suffix(".json.gz")


def main() -> None:
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row

    provinces = [dict(r) for r in c.execute(
        "SELECT province_id, name, code, gaokao_type FROM province ORDER BY province_id"
    )]
    schools = [dict(r) for r in c.execute(
        "SELECT school_id, name, province, city, is_985, is_211, belongs, level, type, nature "
        "FROM schoolinfo ORDER BY school_id"
    )]
    details = [dict(r) for r in c.execute(
        "SELECT school_id, intro FROM schooldetail ORDER BY school_id"
    )]
    scores = [dict(r) for r in c.execute(
        "SELECT school_id, province_id, year, subject_type, batch, score, rank "
        "FROM schoolscore ORDER BY school_id, year"
    )]

    max_year = max((s["year"] for s in scores), default=None)
    payload = {
        "_meta": {
            "exported_at": dt.date.today().isoformat(),
            "max_year": max_year,
            "counts": {
                "provinces": len(provinces),
                "schools": len(schools),
                "details": len(details),
                "scores": len(scores),
            },
        },
        "provinces": provinces,
        "schools": schools,
        "details": details,
        "scores": scores,
    }

    text = json.dumps(payload, ensure_ascii=False)
    OUT_JSON.write_text(text, encoding="utf-8")
    with gzip.open(OUT_GZ, "wb") as f:
        f.write(text.encode("utf-8"))

    mb_json = OUT_JSON.stat().st_size / 1024 / 1024
    mb_gz = OUT_GZ.stat().st_size / 1024 / 1024
    print(f"[done] {OUT_JSON.name}: {mb_json:.2f} MB | {OUT_GZ.name}: {mb_gz:.2f} MB")
    print(f"       省={len(provinces)} 校={len(schools)} 详情={len(details)} 分数线={len(scores)} max_year={max_year}")


if __name__ == "__main__":
    main()
