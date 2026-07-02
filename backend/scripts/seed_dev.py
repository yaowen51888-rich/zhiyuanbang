"""灌入全量种子数据（seed_full.json）到当前引擎（docker PG / 本地 SQLite）。

幂等：默认若 schoolscore 已有数据则跳过（首启灌一次）；--force 强制删旧重灌。
运行：
  cd backend && python scripts/seed_dev.py            # 首启/跳过
  cd backend && python scripts/seed_dev.py --force    # 强制刷新
docker 内由 Dockerfile CMD 自动调用（PYTHONPATH=/app）。
"""
import json
import sys
import time
from pathlib import Path

import app.models  # noqa: F401  确保模型注册以建表
from sqlmodel import Session, SQLModel, delete, select

from app.db import engine
from app.models import Province, SchoolDetail, SchoolInfo, SchoolScore
from app.models.enums import SubjectType
from app.models.province import GaokaoType

JSON_PATH = Path(__file__).resolve().parent / "seed_full.json"
CHUNK = 10_000  # 分数线 18 万条分批 commit，控内存


def seed(force: bool = False) -> None:
    SQLModel.metadata.create_all(engine)
    if not JSON_PATH.exists():
        print(f"[error] 缺 {JSON_PATH.name}：请先运行 python scripts/fetch_data.py 下载，"
              f"或维护者运行 export_seed_full.py 生成。")
        sys.exit(1)

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    with Session(engine) as s:
        already = s.exec(select(SchoolScore).limit(1)).first()
        if already and not force:
            print("[skip] 全量种子已存在，跳过（--force 可强制重灌）")
            return

        school_ids = [sc["school_id"] for sc in data["schools"]]
        province_ids = [p["province_id"] for p in data["provinces"]]
        # 删旧（按本次数据集合，幂等）
        s.exec(delete(SchoolScore).where(SchoolScore.school_id.in_(school_ids or [-1])))
        s.exec(delete(SchoolDetail).where(SchoolDetail.school_id.in_(school_ids or [-1])))
        s.exec(delete(SchoolInfo).where(SchoolInfo.school_id.in_(school_ids or [-1])))
        s.exec(delete(Province).where(Province.province_id.in_(province_ids or [-1])))
        # ponytail: PG 强制 FK，父行先 flush 子行 INSERT 才不违反外键

        for p in data["provinces"]:
            s.add(Province(province_id=p["province_id"], name=p["name"], code=p["code"],
                           gaokao_type=GaokaoType(p["gaokao_type"])))
        s.flush()

        for sc in data["schools"]:
            s.add(SchoolInfo(
                school_id=sc["school_id"], name=sc["name"], province=sc["province"], city=sc["city"],
                is_985=bool(sc["is_985"]), is_211=bool(sc["is_211"]), belongs=sc["belongs"],
                level=sc["level"], type=sc["type"], nature=sc["nature"],
            ))
        s.flush()

        for d in data["details"]:
            s.add(SchoolDetail(school_id=d["school_id"], intro=d.get("intro", "")))
        s.flush()

        # 分数线 18 万条：分批 add_all + commit（依赖 SA2 insertmanyvalues 批量化）
        t0 = time.perf_counter()
        scores = data["scores"]
        for i in range(0, len(scores), CHUNK):
            s.add_all([SchoolScore(
                school_id=sc["school_id"], province_id=sc["province_id"], year=sc["year"],
                subject_type=SubjectType(sc["subject_type"]), batch=sc.get("batch", ""),
                score=sc["score"], rank=sc["rank"],
            ) for sc in scores[i:i + CHUNK]])
            s.commit()
        # ponytail: 若实测灌入 >1 分钟，改 bulk_insert_mappings 绕过 ORM

    meta = data.get("_meta", {})
    print(f"[done] 全量种子已写入：{len(data['schools'])} 校 / {len(data['details'])} 详情 / "
          f"{len(data['scores'])} 分数线 / {len(data['provinces'])} 省（max_year={meta.get('max_year')}）"
          f" [分数线灌入 {time.perf_counter() - t0:.1f}s]")


if __name__ == "__main__":
    seed(force="--force" in sys.argv)
