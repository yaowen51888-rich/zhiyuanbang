"""解析逻辑单测，用造好的小 SQL。"""
import sys
from pathlib import Path

# 添加项目根目录到 sys.path 以便导入 data 模块
# （backend 已在 pyproject.toml 的 pythonpath 中，且 import_mysql_to_pg 会自动添加）
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from import_mysql_to_pg import parse_sc_li_rows, parse_score_rank_rows, parse_major_score_rows


def test_parse_sc_li_normalizes_to_rows():
    """测试 sc_li_score 横向→纵向转换（补维度、跳过0值）。"""
    # 迷你 dump：一行 sc_li_score（横向年份）样本
    SAMPLE = """INSERT INTO `sc_li_score` VALUES (1,100,'电子科技大学',640,2000,635,2100,630,2200);
INSERT INTO `sc_li_score` VALUES (2,101,'四川大学',620,3000,615,3100,0,0);"""

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


def test_parse_score_rank_normalizes_to_rows():
    """测试 score_rank 横向→纵向转换（补维度、跳过0值）。"""
    # 假设原表列序：id, provinceId, score2022, num2022, rank2022, score2021, num2021, rank2021, score2020, num2020, rank2020
    SAMPLE = """INSERT INTO `score_rank` VALUES (1,51,680,100,1000,680,105,1050,680,110,1100);
INSERT INTO `score_rank` VALUES (2,51,670,200,2000,670,210,2100,0,0,0);"""

    rows = parse_score_rank_rows(SAMPLE)
    # 每个横向行 → 3 个纵向年份行，跳过 num=0 或 rank=0 的缺数据
    assert len(rows) == 5  # 行1 三年 + 行2 两年（2020 为 0 跳过）
    first = rows[0]
    assert first["province_id"] == 51
    assert first["year"] == 2022
    assert first["score"] == 680
    assert first["num"] == 100
    assert first["rank"] == 1000
    # 补的默认维度
    from app.models.enums import SubjectType
    assert first["subject_type"] == SubjectType.science  # 默认理科


def test_parse_major_score_normalizes_to_rows():
    """测试 major_score 横向→纵向转换（补维度、跳过0值）。"""
    # 假设原表列序：id, schoolId, majorId, provinceId, year2022, max2022, min2022, avg2022, rank2022, year2021, max2021, min2021, avg2021, rank2021
    SAMPLE = """INSERT INTO `major_score` VALUES (1,100,1001,51,2022,650,640,645,2000,2021,645,635,640,2100);
INSERT INTO `major_score` VALUES (2,101,1002,51,2022,630,620,625,3000,2021,0,0,0,0);"""

    rows = parse_major_score_rows(SAMPLE)
    # 每个横向行 → 2 个纵向年份行，跳过 min_score=0 的缺数据
    assert len(rows) == 3  # 行1 两年 + 行2 一年（2021 为 0 跳过）
    first = rows[0]
    assert first["school_id"] == 100
    assert first["major_id"] == 1001
    assert first["province_id"] == 51
    assert first["year"] == 2022
    assert first["max_score"] == 650
    assert first["min_score"] == 640
    assert first["avg_score"] == 645
    assert first["min_rank"] == 2000
    # 补的默认维度
    from app.models.enums import SubjectType
    assert first["subject_type"] == SubjectType.science  # 默认理科
