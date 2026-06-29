# 百度高考数据采集脚本设计

- 日期：2026-06-28
- 状态：已批准，待实现
- 方案：A — 四川试点验证

## 背景与动机

`gkvr` 后端 `backend/gkvr.db` 现有数据为 `scripts/seed_dev.py` 手造的四川假数据（8 校 / 6 专业 / 单省份 / 单科类）。推荐算法 (`services/recommendation.py`) 的命脉是**录取位次**，当前跑在假数据上。

目标：引入真实录取数据替代假数据，让 `/recommend` 与 `/score-rank` 跑在真实位次上。经多源调研，数据源定为百度高考公开 API（`gaokao.baidu.com`），其 `schoolscore` 接口直接返回录取位次 (`minScoreOrder`)，契合位次法算法。

## 目标

1. schema 支持全国新高考科类（扩 `SubjectType`）
2. 采集全国院校库（`list`，~3052 校）入 `SchoolInfo` / `SchoolDetail`
3. 采集四川学校录取线 + 位次（`schoolscore`，2020–2024，文 + 理）入 `SchoolScore`
4. 脚本参数化（`--provinces`），跑通后可一条命令扩省
5. 全链路验证：schema → 采集 → 入库 → `/recommend` 用真实数据可跑

## 非目标（YAGNI）

- **专业录取线（`MajorScore`）**：当前推荐算法未使用（`recommend.py` 只查 `SchoolScore`）
- **省控线**（阳光高考 chsi / 神州学人 chisa）：算法不用，schema 无对应表
- **招生计划**
- **一分一段表（`ScoreRank`）采集**：继续用 seed 假数据顶（4 个候选源均未提供）
- **断点续传 / 并发 / 代理**
- **全国全量**（3052 校 × 31 省）：~20 万请求 / 数天 / 高封禁风险，留作远期
- **`laosheng.top`**：与百度 `list` 冗余，不采用

## 数据源调研结论

| 项 | 结论 |
|---|---|
| 可用性 | 百度 `list` / `schoolscore` / `majorscore` 匿名可访问（UA + Referer） |
| 含位次 | `minScoreOrder` 直接返回录取位次 |
| 院校规模 | `list` 返回 **3052** 所（2026 已更新） |
| 老高考参数 | 四川 / 理科 / 2024 → 5 条（minScore 645 / rank 5976）✓ |
| 3+3 参数 | 浙江 / 综合 / 2024 → 2 条（664 / 6791）✓ |
| 最新年份 | **2025 大面积缺失**，稳定到 **2024** → 采集年份定 2020–2024 |
| 3+1+2 参数 | curriculum 精确值（湖北等）待脚本运行时枚举探测 |

> 注：2026 录取线在当前时点（2026/06）尚不存在（录取 7–8 月进行）。

## 方案选择

**A 试点省验证（采用）**：先采全国院校库 + 四川录取线，跑通全链路，参数化扩省。
- B 全国重点院校（985/211/双一流 × 31 省）、C 全国全量：留作后续。

## 详细设计

### 文件改动

| 文件 | 操作 |
|---|---|
| `backend/app/models/enums.py` | 改：`SubjectType` 加 `physics` / `history` / `comprehensive` |
| `backend/scripts/crawl_baidu.py` | 新增：采集主脚本 |
| `backend/tests/test_crawl.py` | 新增：纯函数单测 |

### schema 改动

`SubjectType` 枚举新增三值：
- `physics`（物理类，新高考 3+1+2）
- `history`（历史类，新高考 3+1+2）
- `comprehensive`（综合，新高考 3+3）

SQLite 存字符串枚举值，**加值不改表结构，无需迁移**。现有 `science` / `liberal` 数据与 `/recommend`、`/score-rank` 查询逻辑不受影响（按 `province_id + subject_type` 过滤，新值自动适配）。

### `crawl_baidu.py` 结构

```
配置层  UA / Referer / BASE_URL / 限速(默认1req/s) / 重试(3次·指数退避)
字典层  PROVINCES — 省名→(province_id, code, gaokao_type, [curriculums])
        内置全国31省；本次启用四川(51, old, [理科, 文科])
映射层  map_curriculum(百度科类串) → SubjectType
        parse_tags(tag列表) → is_985 / is_211
        upsert_school(session, 校名, ...) → school_id   # 校名自然键，查→复用/插
抓取层  fetch_list() 翻页  /  fetch_schoolscore(校, 省, 科类, 年)
主流程  crawl(provinces, years, fresh)
CLI     --provinces  --years  --fresh  --schools-only  --rate  --top
        参数: --schools-only 只刷院校库不采分数线
              --fresh 清空 SchoolInfo/Detail/Score (保留 ScoreRank)
              --top N 只采排名前 N 或 985/211 子集 (试点缩减用)
```

HTTP 客户端用 `httpx`（已在 dev 依赖；脚本是运维工具，非 app 运行时依赖）。
会话/引擎复用 `app.db.engine`，建表用 `SQLModel.metadata.create_all`，与 `seed_dev.py` 一致。

### 数据流

```
list(分页 → 全国 ~3052 校) ──► SchoolInfo(含 tag 解析 985/211) + SchoolDetail
                                  │
              对 --provinces 每省 × 每科类 × 每年，遍历全国每所院校:
schoolscore(校, 省, 科类, 年) ──► 过滤无效行 ──► SchoolScore(score=最低分, rank=位次)
```

> 说明：`--provinces 四川` 采的是「**全国所有院校在四川省**的录取线」（四川考生需看到全国院校），不是"四川本省院校"。

### 规模与请求优化

四川试点原始规模：~3052 校 × 2 科类(文/理) × 5 年 ≈ **3 万次请求**，控速 1 req/s 约 **8 小时**。
`schoolscore` 带 `year` 参数每次只返回单年；待实现时探测「不带 `year` 是否返回多年」以缩减请求。
试点验证阶段的缩减策略（任选其一，实现时定）：
- `--top` 限定 985/211/双一流（~200 校）→ ~200×2×5 = 2000 次 / ~35 分钟
- 或缩减年份至近 2 年（2023–2024）→ 3052×2×2 ≈ 1.2 万次 / ~3.5 小时

### 映射规则

- **curriculum → SubjectType**：`理科→science`、`文科→liberal`、`物理/物理类→physics`、`历史/历史类→history`、`综合/3+3综合→comprehensive`、其它→跳过并记日志
- **tag**：`"985" in tags → is_985`、`"211" in tags → is_211`
- **行过滤**：`minScore` / `minScoreOrder` 为空或非数字 → 跳过该行
- **province**：`PROVINCES` 字典查 `province_id`（四川 = 51，与 seed 一致）

### 幂等 & 清理

- 校名自然键 upsert：重跑按校名查 `SchoolInfo`，存在复用 `school_id`，不存在才插入；`SchoolScore` 按 `(school_id, province_id, year, subject_type, batch)` 去重 upsert
- `--fresh`：先清空 `SchoolInfo` / `SchoolDetail` / `SchoolScore`，**保留 `ScoreRank`**（一分一段表用 seed 顶），再采
- `--fresh` **默认关闭**（默认增量 upsert，避免误清）

### 健壮性

- 限速（默认 1 req/s，`--rate` 可调）+ 重试（网络错 / 非 200，3 次指数退避）
- 进度日志（每 50 校打印一次）
- 单校失败记错继续，不中断整体采集

### 测试

- `test_crawl.py`：`map_curriculum` / `parse_tags` / 行过滤 的**纯函数单测**（不触网）
- 端到端：手动 `--schools-only` + 小样本 `schoolscore`（如限定 5 校）验证入库字段正确

## 验证标准

1. `map_curriculum` / `parse_tags` / 行过滤单测全绿
2. `crawl_baidu.py --schools-only` 跑通，`SchoolInfo` 入库 ~3000 校
3. `crawl_baidu.py`（四川）跑通，`SchoolScore` 入库真实数据；`/recommend` 用真实位次返回分档结果
4. 重跑幂等（`SchoolScore` 行数不翻倍）
5. `--fresh` 后重新采，数据干净无残留

## 实现时遵循的默认决策

- HTTP 库：`httpx`
- `--fresh` 默认关闭
- 年份范围：2020–2024
- 试点省：四川（文 + 理）
