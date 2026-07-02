# 高考志愿帮（gkvr）

高考志愿填报辅助系统，基于新高考“专业+院校”平行志愿模式，提供院校查询、专业推荐、录取概率评估与志愿表模拟。

## 预览

![首页截图](docs/screenshots/home.png)

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + ECharts
- **后端**：FastAPI + SQLModel + Pydantic + PostgreSQL（开发期可用 SQLite）
- **工具**：uv / pip、npm、pytest、Vitest

## 目录说明

```text
backend/          FastAPI 后端
  app/            业务代码（路由、模型、服务）
  scripts/        数据导入与爬虫脚本
  tests/          pytest 测试
frontend/         Next.js 前端
  app/            App Router 页面
  components/     React 组件
  lib/            工具函数与常量
  types/          API 类型（自动生成）
docs/             设计文档、方案与截图
data/             数据脚本与原始数据
```

## 快速启动

### Docker（推荐，一键起全栈）

```bash
cp .env.example .env          # 按需改 DATA_RELEASE_URL 指向种子数据 Release
docker compose up --build
```

前端 http://localhost:3000，后端 API http://localhost:8000/docs。首次启动自动下载全量种子（gzip 约 2MB）并灌库，约 30 秒。

### 前提（本地开发手动启动）

- Python >= 3.11
- Node.js >= 20
- PostgreSQL（可选，默认 SQLite）

### 后端

```bash
cd backend
uv sync
uv run python scripts/fetch_data.py   # 下载全量种子（需配 DATA_RELEASE_URL，见数据说明）
uv run python scripts/seed_dev.py     # 灌库
uv run uvicorn app.main:app --reload
```

或使用 pip：

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:3000。

### 类型生成

前端类型由后端 OpenAPI 自动生成：

```bash
cd frontend
npm run gen-types
```

## 数据说明

- **来源**：院校基础信息与历年分数线采集自百度高考公开数据（`gaokao.baidu.com`），均为公开事实数据（分数线、录取位次、985/211、院校类型等）；`院校简介`字段为空，无第三方文本版权。
- **规模**：31 省 / 约 3000 院校 / 约 18 万条分数线（最近录取年份 2024）。
- **分发**：全量数据 gzip 压缩后约 2MB，发布在 GitHub Release，首次启动由 `backend/scripts/fetch_data.py` 自动下载并灌库，不进入 git 仓库。
- **免责**：本数据集仅供学习演示，实际志愿填报请以各省教育考试院官方发布为准。

### 更新数据（维护者）

```bash
cd backend && python scripts/export_seed_full.py    # 生成 seed_full.json.gz
# 上传到 GitHub Release，更新 .env 的 DATA_RELEASE_URL
```

## 主要功能

- **智能推荐**：输入分数、省份、科类，生成“冲 · 稳 · 保 · 垫”四档院校方案
- **院校查询**：按省份、类型、985/211 筛选，查看历年分数线与位次
- **专业百科**：按学科门类浏览专业详情
- **模拟填报**：拖拽排序志愿表，本地保存多套方案

## 许可证

详见 [NOTICE](NOTICE)。
