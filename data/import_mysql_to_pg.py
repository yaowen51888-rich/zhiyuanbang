"""把原项目 MySQL dump 导入 PostgreSQL：补维度 + 规范化。

用法：python data/import_mysql_to_pg.py
前提：data/source_sql/ 下放原 dump；DATABASE_URL 指向目标 PG。

此脚本针对原项目的横向表结构进行解析，转换为纵向规范化表结构，
并补全缺失的维度（province_id、subject_type、batch）。
"""
import re
import sys
from pathlib import Path

from sqlmodel import Session, SQLModel

# 添加 backend 目录到 sys.path 以便导入 app 模块
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.config import settings
from app.db import engine
from app.models import SchoolScore, ScoreRank, MajorScore
from app.models.enums import SubjectType

SOURCE_DIR = Path(__file__).parent / "source_sql"
DEFAULT_PROVINCE_ID = 51  # 四川
DEFAULT_SUBJECT_TYPE = SubjectType.science  # 默认理科
DEFAULT_BATCH = "本科一批"

# 横向 sc_li_score 列序：id, schoolId, schoolName, score2022, rank2022, score2021, rank2021, score2020, rank2020
_SC_LI_RE = re.compile(
    r"INSERT INTO `sc_li_score` VALUES\s*(.+?);", re.DOTALL
)

# 横向 score_rank 列序（假设）：id, provinceId, score2022, num2022, rank2022, score2021, num2021, rank2021, score2020, num2020, rank2020
_SCORE_RANK_RE = re.compile(
    r"INSERT INTO `score_rank` VALUES\s*(.+?);", re.DOTALL
)

# 横向 major_score 列序（假设）：id, schoolId, majorId, provinceId, year2022, max2022, min2022, avg2022, rank2022, year2021, max2021, min2021, avg2021, rank2021
_MAJOR_SCORE_RE = re.compile(
    r"INSERT INTO `major_score` VALUES\s*(.+?);", re.DOTALL
)


def _parse_tuples(values_blob: str) -> list[list[str | int]]:
    """从 VALUES (...) 中拆出每行字段（简易：按 '),(' 切）。"""
    blob = values_blob.strip().lstrip("(").rstrip(")")
    rows = []
    for raw in blob.split("),("):
        fields = [f.strip().strip("'\"") for f in raw.split(",")]
        rows.append(fields)
    return rows


def parse_sc_li_rows(sql_text: str) -> list[dict]:
    """把横向 sc_li_score 解析为纵向 school_score 行（补 province_id/subject_type）。

    原表列序：id, schoolId, schoolName, score2022, rank2022, score2021, rank2021, score2020, rank2020

    转换规则：
    - 每个横向行展开为多个纵向行（每年一行）
    - 跳过 score=0 或 rank=0 的缺数据行
    - 补全 province_id（默认51四川）、subject_type（默认理科）、batch（默认本科一批）
    """
    out: list[dict] = []
    for m in _SC_LI_RE.finditer(sql_text):
        for fields in _parse_tuples(m.group(1)):
            # fields: [id, schoolId, schoolName, s2022, r2022, s2021, r2021, s2020, r2020]
            school_id = int(fields[1])
            year_map = {
                2022: (fields[3], fields[4]),
                2021: (fields[5], fields[6]),
                2020: (fields[7], fields[8])
            }
            for year, (s, r) in year_map.items():
                score = int(s) if s and s != "0" else None
                rank = int(r) if r and r != "0" else None
                if score is None or rank is None:
                    continue
                out.append({
                    "school_id": school_id,
                    "province_id": DEFAULT_PROVINCE_ID,
                    "year": year,
                    "subject_type": DEFAULT_SUBJECT_TYPE,
                    "batch": DEFAULT_BATCH,
                    "score": score,
                    "rank": rank,
                })
    return out


def parse_score_rank_rows(sql_text: str) -> list[dict]:
    """把横向 score_rank 解析为纵向 score_rank 行（补 subject_type）。

    原表列序（假设）：id, provinceId, score2022, num2022, rank2022, score2021, num2021, rank2021, score2020, num2020, rank2020

    转换规则：
    - 每个横向行展开为多个纵向行（每年一行）
    - 跳过 num=0 或 rank=0 的缺数据行
    - 补全 subject_type（默认理科）、batch（默认空字符串）
    """
    out: list[dict] = []
    for m in _SCORE_RANK_RE.finditer(sql_text):
        for fields in _parse_tuples(m.group(1)):
            # fields: [id, provinceId, score2022, num2022, rank2022, score2021, num2021, rank2021, score2020, num2020, rank2020]
            province_id = int(fields[1])
            year_map = {
                2022: (fields[2], fields[3], fields[4]),  # (score, num, rank)
                2021: (fields[5], fields[6], fields[7]),
                2020: (fields[8], fields[9], fields[10])
            }
            for year, (score, num, rank_str) in year_map.items():
                num_val = int(num) if num and num != "0" else None
                rank_val = int(rank_str) if rank_str and rank_str != "0" else None
                score_val = int(score) if score and score != "0" else None
                if num_val is None or rank_val is None or score_val is None:
                    continue
                out.append({
                    "province_id": province_id,
                    "year": year,
                    "subject_type": DEFAULT_SUBJECT_TYPE,
                    "score": score_val,
                    "num": num_val,
                    "rank": rank_val,
                    "batch": "",
                })
    return out


def parse_major_score_rows(sql_text: str) -> list[dict]:
    """把横向 major_score 解析为纵向 major_score 行（补 subject_type）。

    原表列序（假设）：id, schoolId, majorId, provinceId, year2022, max2022, min2022, avg2022, rank2022, year2021, max2021, min2021, avg2021, rank2021

    转换规则：
    - 每个横向行展开为多个纵向行（每年一行）
    - 跳过 min_score=0 的缺数据行
    - 补全 subject_type（默认理科）、batch（默认本科一批）
    """
    out: list[dict] = []
    for m in _MAJOR_SCORE_RE.finditer(sql_text):
        for fields in _parse_tuples(m.group(1)):
            # fields: [id, schoolId, majorId, provinceId, year2022, max2022, min2022, avg2022, rank2022, year2021, max2021, min2021, avg2021, rank2021]
            school_id = int(fields[1])
            major_id = int(fields[2])
            province_id = int(fields[3])
            year_map = {
                2022: (fields[5], fields[6], fields[7], fields[8]),  # (max, min, avg, rank)
                2021: (fields[10], fields[11], fields[12], fields[13])
            }
            for year, (max_s, min_s, avg_s, rank_str) in year_map.items():
                min_score_val = int(min_s) if min_s and min_s != "0" else None
                if min_score_val is None:
                    continue
                max_score_val = int(max_s) if max_s and max_s != "0" else None
                avg_score_val = int(avg_s) if avg_s and avg_s != "0" else None
                rank_val = int(rank_str) if rank_str and rank_str != "0" else None
                out.append({
                    "school_id": school_id,
                    "major_id": major_id,
                    "province_id": province_id,
                    "year": year,
                    "subject_type": DEFAULT_SUBJECT_TYPE,
                    "batch": DEFAULT_BATCH,
                    "max_score": max_score_val,
                    "min_score": min_score_val,
                    "avg_score": avg_score_val,
                    "min_rank": rank_val,
                })
    return out


def import_all() -> None:
    """导入所有数据到 PostgreSQL（单事务原子性）。"""
    sql_files = sorted(SOURCE_DIR.glob("*.sql"))
    if not sql_files:
        print(f"[skip] {SOURCE_DIR} 下无 .sql 文件，请先放入原项目 dump", file=sys.stderr)
        return

    text = "\n".join(f.read_text(encoding="utf-8", errors="ignore") for f in sql_files)

    # 解析所有表
    sc_rows = parse_sc_li_rows(text)
    sr_rows = parse_score_rank_rows(text)
    ms_rows = parse_major_score_rows(text)

    # 单 Session 单 commit 保证原子性
    with Session(engine) as s:
        for r in sc_rows:
            s.add(SchoolScore(**r))
        for r in sr_rows:
            s.add(ScoreRank(**r))
        for r in ms_rows:
            s.add(MajorScore(**r))
        s.commit()

    print(f"[done] 导入 {len(sc_rows)} 条 school_score（四川）")
    print(f"[done] 导入 {len(sr_rows)} 条 score_rank（四川）")
    print(f"[done] 导入 {len(ms_rows)} 条 major_score（四川）")


if __name__ == "__main__":
    # 注册所有模型到 SQLModel.metadata
    import app.models  # noqa: F401
    # 仅在真实运行导入时建表
    SQLModel.metadata.create_all(engine)
    import_all()
