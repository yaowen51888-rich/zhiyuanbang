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

### 前提

- Python >= 3.11
- Node.js >= 20
- PostgreSQL（可选，默认 SQLite）

### 后端

```bash
cd backend
uv sync
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

## 主要功能

- **智能推荐**：输入分数、省份、科类，生成“冲 · 稳 · 保 · 垫”四档院校方案
- **院校查询**：按省份、类型、985/211 筛选，查看历年分数线与位次
- **专业百科**：按学科门类浏览专业详情
- **模拟填报**：拖拽排序志愿表，本地保存多套方案

## 许可证

详见 [NOTICE](NOTICE)。
