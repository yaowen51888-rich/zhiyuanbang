"""开发用四川种子数据：写入 backend/gkvr.db，解锁前端联调。

幂等：每次运行先清空相关表再插入。
运行：cd backend && python scripts/seed_dev.py

数据相对「四川理科 600 分 / 位次 5000」的考生构造，覆盖冲/稳/保/垫各档，
使 POST /recommend 能返回完整分档结果。
"""
import app.models  # noqa: F401  确保模型注册以建表
from sqlmodel import Session, SQLModel, delete

from app.db import engine
from app.models import (
    MajorInfo,
    MajorScore,
    Province,
    ScoreRank,
    SchoolDetail,
    SchoolInfo,
    SchoolScore,
)
from app.models.enums import SubjectType
from app.models.province import GaokaoType

SC = SubjectType.science
PROV = 51  # 四川
YEAR = 2022

# 学校：(school_id, name, city, is_985, is_211, belongs, level, type, nature, intro, [3年录取位次])
# 位次均值相对考生 5000：1→冲(4500) 2→稳(5000) 3/4→保(5500/5800) 5~8→垫
SCHOOLS = [
    (1, "电子科技大学", "成都", True, True, "教育部", "本科", "理工", "公办",
     "电子科技大学是教育部直属全国重点大学，位列 985/211、双一流，以电子信息科学技术为核心。",
     [4500, 4600, 4400]),
    (2, "四川大学", "成都", True, True, "教育部", "本科", "综合", "公办",
     "四川大学是教育部直属全国重点大学，985/211、双一流，学科门类齐全的综合性研究型大学。",
     [5000, 5050, 4950]),
    (3, "西南交通大学", "成都", False, True, "教育部", "本科", "理工", "公办",
     "西南交通大学是教育部直属全国重点大学，211 工程、双一流，以轨道交通为特色。",
     [5500, 5600, 5400]),
    (4, "西南财经大学", "成都", False, True, "教育部", "本科", "财经", "公办",
     "西南财经大学是教育部直属 211 工程、双一流高校，被誉为中国金融人才库。",
     [5800, 5900, 5700]),
    (5, "四川农业大学", "雅安", False, True, "四川省", "本科", "农林", "公办",
     "四川农业大学是 211 工程、双一流建设高校，以生物科技为特色，农学为主。",
     [6200, 6250, 6150]),
    (6, "成都理工大学", "成都", False, False, "四川省", "本科", "理工", "公办",
     "成都理工大学是国家双一流建设高校，以地质、能源、资源科学为特色。",
     [6500, 6600, 6400]),
    (7, "西南民族大学", "成都", False, False, "国家民委", "本科", "民族", "公办",
     "西南民族大学是国家民委直属综合性民族高等学校。",
     [7000, 7100, 6900]),
    (8, "四川师范大学", "成都", False, False, "四川省", "本科", "师范", "公办",
     "四川师范大学是四川省属重点大学，师范特色鲜明。",
     [6000, 6050, 5950]),
]

# 四川理科一分一段表：(分数, 累计位次)
RANK_TABLE = [
    (700, 80), (680, 500), (660, 1200), (640, 2200), (620, 3000),
    (610, 4000), (600, 5000), (595, 5600), (590, 6200), (580, 7500),
    (570, 9000), (550, 12000),
]

# 专业：(major_id, name, category, subcategory, specific, school_id, [3年(min,max,avg,min_rank)])
MAJORS = [
    (1, "计算机科学与技术", "工学", "计算机类", "计算机科学与技术", 1,
     [(625, 660, 640, 3500), (620, 655, 635, 3700), (630, 665, 645, 3300)]),
    (2, "软件工程", "工学", "软件工程类", "软件工程", 1,
     [(620, 650, 632, 3800), (615, 645, 628, 4000), (622, 652, 635, 3600)]),
    (3, "金融学", "经济学", "金融学类", "金融学", 4,
     [(595, 620, 605, 5000), (590, 615, 600, 5400), (598, 622, 608, 4800)]),
    (4, "临床医学", "医学", "临床医学类", "临床医学", 2,
     [(610, 650, 625, 3500), (605, 645, 620, 3700), (615, 655, 630, 3300)]),
    (5, "电气工程及其自动化", "工学", "电气类", "电气工程及其自动化", 3,
     [(590, 615, 600, 5500), (585, 610, 595, 5800), (592, 618, 602, 5300)]),
    (6, "汉语言文学", "文学", "中国语言文学类", "汉语言文学", 8,
     [(580, 605, 590, 7500), (575, 600, 585, 7800), (582, 608, 592, 7200)]),
]


def _score_for_rank(rank: int) -> int:
    """按一分一段表反查录取最低分（详情图表展示用，不必精确）。位次越小分越高。"""
    for sc, rk in RANK_TABLE:
        if rk >= rank:
            return sc
    return 550


def seed() -> None:
    SQLModel.metadata.create_all(engine)
    years = [YEAR, YEAR - 1, YEAR - 2]  # 2022 / 2021 / 2020
    with Session(engine) as s:
        # 清空相关表（幂等）
        for m in (MajorScore, MajorInfo, SchoolScore, SchoolDetail, ScoreRank, SchoolInfo, Province):
            s.exec(delete(m))

        s.add(Province(province_id=PROV, name="四川", code="51", gaokao_type=GaokaoType.old))

        for sc, rk in RANK_TABLE:
            s.add(ScoreRank(province_id=PROV, year=YEAR, subject_type=SC,
                            score=sc, num=0, rank=rk, batch="本科一批"))

        for sid, name, city, is985, is211, belongs, level, typ, nature, intro, ranks in SCHOOLS:
            s.add(SchoolInfo(school_id=sid, name=name, province="四川", city=city,
                             is_985=is985, is_211=is211, belongs=belongs,
                             level=level, type=typ, nature=nature))
            s.add(SchoolDetail(school_id=sid, intro=intro))
            for y, rk in zip(years, ranks):
                s.add(SchoolScore(school_id=sid, province_id=PROV, year=y, subject_type=SC,
                                  batch="本科一批", score=_score_for_rank(rk), rank=rk))

        for mid, name, cat, sub, spec, sid, rows in MAJORS:
            s.add(MajorInfo(major_id=mid, name=name, category=cat, subcategory=sub, specific=spec))
            for y, (mn, mx, avg, mr) in zip(years, rows):
                s.add(MajorScore(school_id=sid, major_id=mid, province_id=PROV, year=y,
                                 subject_type=SC, batch="本科一批",
                                 max_score=mx, min_score=mn, avg_score=avg, min_rank=mr))

        s.commit()
    print(f"[done] 四川种子数据已写入 gkvr.db：{len(SCHOOLS)} 校 / {len(MAJORS)} 专业")


if __name__ == "__main__":
    seed()
