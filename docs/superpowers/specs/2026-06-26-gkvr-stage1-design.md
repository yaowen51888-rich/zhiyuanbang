# 高考志愿推荐系统（gkvr）阶段 1 设计文档

- **创建日期**：2026-06-26
- **阶段**：阶段 1（全国化数据模型 + 单省跑通全链路）
- **状态**：待评审

---

## 1. 背景与定位

基于开源项目 `electronic-pig/gkvr_system_frontend` 与 `gkvr_system_backend`（均为 MIT 协议）的产品思路，换栈重构并升级。原项目为大学课设，存在三个核心缺陷：

1. **仅单省数据**（推测为四川）：核心分数线表缺省份维度，无法服务全国用户。
2. **推荐算法为占位**：作者自陈"仅简单计算公式"，非系统重点。
3. **技术栈陈旧**：Vue3 + Spring Boot + MySQL 5.7（已 EOL）。

本项目目标是构建一个**全国性**高考志愿推荐系统，分三阶段推进。**本文件仅描述阶段 1。**

### 致谢与协议合规
原项目采用 MIT 协议。本项目在 `NOTICE` / `THIRD_PARTY_LICENSES` 文件中保留原版权声明与 MIT 协议全文（法律义务），并在 README 中致谢（礼节）。

---

## 2. 多阶段路线图

| 阶段 | 目标 | 状态 |
|---|---|---|
| **阶段 1** | 全国化数据模型 + 四川数据跑通前后端+算法全链路 | **本文档** |
| 阶段 2 | 全国数据采集系统（Scrapling spider） | 独立 spec |
| 阶段 3 | 全国数据填充 + 新高考选科维度 | 独立 spec |

每阶段独立 spec → plan → 实现。阶段 1 的数据模型**按全国终态设计**，避免后续返工。

---

## 3. 阶段 1 范围

### 纳入
- 数据模型按全国终态设计（含 `province_id`、科类、年份维度）
- 推荐算法：位次法 + 冲稳保垫分档 + 经验概率
- 前后端全链路：学校查询、学校详情、专业查询、志愿推荐、模拟填报
- 数据填充：**仅四川省**（现成 SQL 导入，补维度默认值）
- 科类：**仅文/理**（匹配 2020-2022 现成数据；四川 2025 才转新高考）
- UI：省份选择器保留（终态），阶段 1 仅四川可选，其他省份提示「数据采集中」

### 排除（明确划出，防 scope creep）
- 全国数据采集 → 阶段 2
- 新高考选科维度 → 阶段 3
- 用户账号系统（已定匿名 + 本地存储）
- 采集调度 / 数据校验后台 → 阶段 2/3

---

## 4. 技术决策

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Next.js 15 (App Router) + TypeScript | 学 React 竞争力；RSC 是当前主流 |
| UI 组件 | shadcn/ui + Tailwind CSS | 2026 事实标准，作品集加分 |
| 图表 | Apache ECharts（封装为 Client Component） | 图表密集场景，沿用原项目选型 |
| 后端框架 | FastAPI | Python 生态，算法友好，自动产出 OpenAPI |
| 数据库 | PostgreSQL 16 | MySQL 5.7 已 EOL；PG 对窗口函数/JSON 支持更好 |
| ORM | SQLModel | Pydantic + SQLAlchemy，类型友好 |
| 客户端状态 | Zustand + `persist` 中间件 | 志愿表存 localStorage |
| 服务端数据 | RSC 内 `fetch`；客户端交互用 TanStack Query | 混合渲染 |
| 端到端类型 | FastAPI OpenAPI → `openapi-typescript` 生成 TS 类型 | 前后端契约类型安全 |
| 进程编排 | 根目录 `concurrently` 一键同启前后端 | 单仓库开发体验 |
| 采集（阶段 2） | Scrapling | 全国化时引入，本文档不展开 |

---

## 5. 整体架构

### 5.1 目录结构
```
gkvr/
├── frontend/              # Next.js 15 (App Router)
│   ├── app/               # 路由（RSC + Client Components）
│   ├── components/        # UI 组件（shadcn/ui + 自定义 + ECharts）
│   ├── lib/               # api 客户端、Zustand store、工具函数
│   ├── types/             # openapi-typescript 生成的类型（不手改）
│   └── package.json
├── backend/               # FastAPI
│   ├── app/
│   │   ├── main.py        # 入口 + CORS + 全局异常处理
│   │   ├── config.py      # 配置（含算法阈值常量）
│   │   ├── db.py          # 引擎/会话
│   │   ├── models/        # SQLModel 表定义
│   │   ├── schemas/       # Pydantic 请求/响应模型
│   │   ├── routers/       # schools / majors / score_rank / recommend
│   │   └── services/
│   │       └── recommendation.py   # 位次法 + 冲稳保 + 概率 ★核心
│   ├── tests/             # pytest（算法单元测试）
│   └── pyproject.toml
├── data/
│   ├── source_sql/        # 原项目现成 SQL（MySQL 语法）
│   └── import_mysql_to_pg.py   # 导入脚本（含维度补充与规范化）
├── docs/                  # 本文档及后续 spec
├── NOTICE                 # 原项目 MIT 版权声明
└── package.json           # concurrently 同启前后端
```

### 5.2 服务端口
- 前端 Next.js：`http://localhost:3000`
- 后端 FastAPI：`http://localhost:8000`（OpenAPI 文档 `/docs`）
- 前端 RSC 通过 `process.env.API_BASE_URL`（默认 `http://localhost:8000`）调用后端

### 5.3 类型同步流程
1. FastAPI 启动自动产出 `/openapi.json`
2. 脚本 `frontend:gen-types`（`openapi-typescript`）读取 openapi.json → 生成 `frontend/types/api.ts`
3. 前端所有 API 调用基于 `api.ts` 的类型，契约变更即编译报错

---

## 6. 数据模型（PostgreSQL，全国化设计）

> 关键改进：原 `sc_li_score` 横向年份列（`score2020/2021/2022`）为反范式，改为纵向一行一年（`school_score`），便于任意年份查询与未来扩展。所有分数线/位次表补齐 `province_id`、科类、年份维度。

### 6.1 `province`（省份字典，新增）
| 字段 | 类型 | 说明 |
|---|---|---|
| province_id | PK | 省份主键 |
| name | text | 省份名 |
| code | text | 国标省份码 |
| gaokao_type | enum | `old`（老高考）/ `new_3_3` / `new_3_1_2`（为阶段 3 预留，阶段 1 全填 `old`） |

### 6.2 `school_info`（学校基本信息）
| 字段 | 类型 | 说明 |
|---|---|---|
| school_id | PK | |
| name | text | 校名 |
| province | text | 学校所在省 |
| city | text | |
| is_985 | bool | |
| is_211 | bool | |
| belongs | text | 隶属（教育部/省/部省共建等） |
| level | text | 办学层次（本科/专科） |
| type | text | 类型（综合/理工/师范/...） |
| nature | text | 性质（公办/民办） |

> 去除原表 `month_view`/`total_view` 等运营统计字段（YAGNI）。

### 6.3 `school_detail`（学校详情正文）
| 字段 | 类型 | 说明 |
|---|---|---|
| school_id | PK / FK | |
| intro | text | 学校简介 |

### 6.4 `major_info`（专业信息）
| 字段 | 类型 | 说明 |
|---|---|---|
| major_id | PK | |
| name | text | 专业名 |
| category | text | 学科门类（原 level1） |
| subcategory | text | 专业类（原 level2） |
| specific | text | 具体专业（原 level3） |

### 6.5 `score_rank`（一分一段表）★ 算法核心，全国化
| 字段 | 类型 | 说明 |
|---|---|---|
| id | PK | |
| province_id | FK | 生源省 |
| year | int | 年份 |
| subject_type | enum | `liberal`(文) / `science`(理) |
| score | int | 分数 |
| num | int | 该分数人数 |
| rank | int | 累计位次（全省排名） |
| batch | text | 批次（本科一批/...） |

- 索引：`(province_id, year, subject_type, score)`

### 6.6 `school_score`（学校录取分数线）★ 规范化（替代原 `sc_li_score`）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | PK | |
| school_id | FK | |
| province_id | FK | 生源省（录取该省考生的线） |
| year | int | 年份 |
| subject_type | enum | 文/理 |
| batch | text | 批次 |
| score | int | 录取最低分 |
| rank | int | 录取最低位次 |

- 索引：`(school_id, province_id, subject_type, year)`
- 原 `sc_li_score` 的 `score2020/rank2020/...` 横向列在此表拆为三行（每年一行）。

### 6.7 `major_score`（专业录取分数线）★ 补 `year`、`subject_type`
| 字段 | 类型 | 说明 |
|---|---|---|
| id | PK | |
| school_id | FK | |
| major_id | FK | |
| province_id | FK | 生源省（原表已有） |
| year | int | **新增** |
| subject_type | enum | **新增** 文/理 |
| batch | text | |
| max_score | int | 专业录取最高分 |
| min_score | int | 最低分 |
| avg_score | int | 平均分 |
| min_rank | int | 最低位次（原 `min_section`） |

- 索引：`(school_id, major_id, province_id, year)`

### 6.8 枚举：`subject_type`
阶段 1 取值：`liberal`（文）、`science`（理）。阶段 3 扩展 `physics` / `history` / 选科组合。

---

## 7. 后端模块与推荐算法

### 7.1 API 路由
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/schools` | 学校列表，支持筛选（province/is_985/is_211/type/keyword）与分页 |
| GET | `/schools/{id}` | 学校详情（含基本信息 + 详情 + 历年 `school_score`） |
| GET | `/majors` | 专业列表，支持按 category/keyword 筛选 |
| GET | `/majors/{id}/scores` | 某专业历年 `major_score` |
| GET | `/score-rank` | 查询：分数 → 位次（入参 province/year/subject_type/score） |
| POST | `/recommend` | 志愿推荐（入参 province/subject_type/score/batch?） |

### 7.2 推荐算法（`services/recommendation.py`）★ 系统核心

**输入**：`province_id`、`subject_type`、`score`、可选 `batch`

**步骤**：
1. **位次换算**：以 `(province, year = 数据中最大年份（阶段 1 为 2022）, subject_type, score)` 查 `score_rank`，得考生位次 `R`。
2. **候选学校历年位次**：查同省同科类近 3 年 `school_score.rank`，得每校历年录取位次序列，算均值 `M` 与最小值 `M_min`、最大值 `M_max`。
3. **分档**（考生位次 `R` 相对录取位次 `M`；**位次越小排名越靠前**）：

| 条件 | 档位 | 含义 |
|---|---|---|
| `R ≤ M × 0.85` | 垫 | 位次远好于录取线，必录但浪费志愿 |
| `M × 0.85 < R ≤ M × 0.95` | 保 | 大概率录取 |
| `M × 0.95 < R ≤ M × 1.05` | 稳 | 较稳 |
| `M × 1.05 < R ≤ M × 1.15` | 冲 | 有机会 |
| `R > M × 1.15` | 不推荐 | 默认过滤 |

   - 阈值 `0.85 / 0.95 / 1.05 / 1.15` 为 `config.py` 常量，便于调参。
4. **录取概率**（0-100）：以 `M` 为中心，按 `R` 的相对位置经验映射。`R` 越小（越靠前）概率越高；用 `M_min`/`M_max` 区间宽度（历年波动）调节曲线陡峭度——波动大的学校概率衰减更缓。具体函数为分段线性或缩放后的 sigmoid，阈值与系数均放 `config.py`。
5. **输出**：学校列表，每条含 `school_id/name/档位/概率/历年位次区间`，按档位（冲→稳→保→垫）与概率排序，前端分组渲染。

**正确性约束**：算法纯函数化（输入→输出可复现），便于单测；所有阈值外置可调。

---

## 8. 前端模块（Next.js App Router）

### 8.1 路由
| 路由 | 渲染 | 说明 |
|---|---|---|
| `/` | RSC | 首页（系统介绍 + 入口） |
| `/schools` | RSC | 学校列表 + 筛选（985/211/省份/类型/关键词） |
| `/schools/[id]` | RSC | 学校详情 + 历年分数线 ECharts 折线 |
| `/majors` | RSC | 专业查询 |
| `/majors/[id]` | RSC | 专业详情 + 历年专业分 |
| `/recommend` | Client | 表单（省/科类/分数）→ TanStack Query 调 `/recommend` → 冲稳保分组列表 + 概率 ECharts |
| `/fill` | Client | 模拟填报 + 志愿表（Zustand，增删拖序） |

### 8.2 组件
- shadcn/ui 基础组件（Button/Card/Table/Select/Tabs/Toast 等）
- `EChart`：ECharts 的 Client Component 封装（`'use client'`，按 props 渲染 option）
- `WishlistTable`：志愿表，Zustand store + `persist` → localStorage
- `RecommendResult`：推荐结果分组渲染（冲/稳/保/垫 Tab）

### 8.3 状态
- `useWishlistStore`（Zustand）：志愿表 items，`persist` 到 localStorage key `gkvr-wishlist`
- TanStack Query：`/recommend`、详情页交互数据缓存

### 8.4 视觉设计语言（亲和教育型 · 薄荷蓝绿）

**设计基调**：清新冷静、缓解焦虑，面向学生用户，契合志愿填报的严肃性。

**配色 token（Tailwind 自定义变量）：**
| 用途 | token | 色值 |
|---|---|---|
| 页面底色 | `mint-bg` | `#F0F9F7` |
| 卡片底 | `card` | `#FFFFFF` |
| 品牌主色 | `brand` | `#4FB3A9`（蓝绿） |
| 主色深 | `brand-dark` | `#3A9A90` |
| 正文 | `ink` | `#2D3E40` |
| 次要文字 | `ink-muted` | `#6B8588` |
| 冲（rush） | `rush` | `#F6A56C`（柔橙） |
| 稳（stable） | `stable` | `#4FB3A9`（蓝绿） |
| 保（safe） | `safe` | `#7FBF6B`（柔绿） |
| 垫（pad） | `pad` | `#9DB5B8`（灰蓝） |

**质感：**
- 圆角：卡片 `rounded-2xl`(16px)，徽章/按钮 `rounded-full`
- 阴影：柔和大阴影（低透明度主色调，非纯黑）
- 字体：圆润无衬线（中文系统圆体 + 英文 Inter/Nunito），字重对比建立层级
- 点缀：克制使用 `lucide-react` 图标 + emoji（nav logo 配 🌿），不堆砌插画

**页面布局：**
- **首页**：hero（欢迎语 + CTA「开始我的推荐」）+ 三特色卡（学校查询/智能推荐/模拟填报），居中留白
- **推荐页**：**纵向流式**——顶部输入条（省/科类/分数/生成按钮）+ 冲稳保垫大 Tab + 结果流卡片（每卡：校名/位次/档位徽章/概率%）。移动端优先，桌面端结果区可多列
- **学校详情**：信息卡（属性标签）+ 历年分数线 ECharts 折线（蓝绿主色）
- **填报页**：志愿表卡片列表（来自 Zustand）+ 增删/排序

**响应式**：移动端优先（纵向流天然适配），断点 `sm/md/lg` 调整结果区列数。

**深色模式**：阶段 1 先做浅色，预留 `dark:` token，阶段 2/3 启用。

---

## 9. 数据流

- **查询流**（学校/专业列表与详情）：浏览器 → Next.js RSC（服务端）→ `fetch` FastAPI → 渲染 HTML（SEO 友好，首屏快）
- **推荐流**：`/recommend` 表单提交 → Client Component → TanStack Query → `POST /recommend` → 冲稳保结果 + 概率 ECharts
- **志愿流**：详情/推荐页点「加入志愿表」→ Zustand action → `persist` 写 localStorage；`/fill` 页读取展示

---

## 10. 错误处理

- **后端**：FastAPI 全局异常处理器 + Pydantic 入参校验 + 统一响应 `{code, message, data}`；算法层对「无位次数据」「无候选学校」返回明确业务错误码而非 500。
- **前端**：TanStack Query `error` 状态 + shadcn `toast`/`alert`；RSC 页面用 `error.tsx` 边界。
- **边界场景**：分数超出该省一分一段表范围、某校无历年位次、查询无结果——均返回可读提示，不崩溃。

---

## 11. 测试策略（聚焦命门，不全量覆盖）

- **算法单元测试（最高优先级，必须）**：`pytest` 覆盖
  - 分数→位次换算正确性
  - 冲稳保垫分档边界（含各阈值临界值）
  - 概率单调性（位次越靠前概率越高）与范围（0-100）
  - 无数据 / 无候选场景
- **前端**：`Vitest` 测纯函数（如分档展示映射、志愿表去重逻辑）。
- **不做**：E2E、全组件测试（YAGNI，核心链路人工验证）。

---

## 12. 数据导入方案（MySQL → PostgreSQL）

现成 SQL 为 MySQL 5.7 语法 + 横向年份结构 + 缺省份维度。`data/import_mysql_to_pg.py` 处理：

1. **解析**：读取 `data/source_sql/` 下原 dump（用 `sqlparse` 拆分 INSERT 语句，或先 `mysql` 导入临时 SQLite 中转）。
2. **维度补充**：
   - `score_rank`、`school_score`：补 `province_id = 四川`、`subject_type`（按原 `sc_li_score` 的文/理推断）、`year`（从原横向列名拆 2020/2021/2022）。
3. **规范化**：原 `sc_li_score` 横向行 → `school_score` 纵向多行（每年一行）。
4. **写入 PG**：批量 `INSERT`，建立 6.5–6.7 的索引。
5. **校验**：导入后断言行数、抽查学校位次是否落在合理区间。

> 导入脚本一次性运行，结果即阶段 1 的种子数据。阶段 2 的采集系统将产出相同 schema 的全国数据，直接覆盖/合并。

---

## 13. 后续阶段接口预留

- `province.gaokao_type` 字段：阶段 3 用于区分新老高考，驱动前端科类选择器（文/理 vs 物理/历史 + 选科）。
- `subject_type` 枚举：可扩展，不破坏阶段 1 取值。
- `school_score` / `major_score` 的纵向年份结构：阶段 2 采集任意年份直接追加，无需改表。
- API 路径 `/recommend` 入参已含 `province_id`，阶段 3 全国化无需改契约，仅数据量变化。

---

## 14. 验收标准（阶段 1）

1. `concurrently` 一键启动前后端，前端可访问、后端 `/docs` 可用。
2. 四川省学校/专业查询、详情页（含 ECharts 历年分数线）正常。
3. 输入省/科类/分数，`/recommend` 返回冲稳保垫分组 + 概率，结果合理（位次靠前的考生"冲"少"保"多）。
4. 志愿表可增删、刷新页面后 localStorage 持久化。
5. 算法单元测试全绿，覆盖分档边界与概率单调性。
6. 前后端类型同步脚本可用，前端基于生成类型调用 API。
