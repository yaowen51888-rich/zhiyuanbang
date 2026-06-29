# 高考志愿帮 - 前端

项目前端基于 Next.js 16 App Router + React 19 + Tailwind CSS v4 + shadcn/ui。

## 技术栈

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) + Radix UI
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
- [ECharts](https://echarts.apache.org/)
- [Vitest](https://vitest.dev/)

## 启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000。

## 脚本

- `npm run dev` — 启动开发服务器
- `npm run build` — 生产构建
- `npm run lint` — ESLint 检查
- `npm run test` — Vitest 测试
- `npm run gen-types` — 从 `../backend/openapi.json` 生成 API 类型

## 环境变量

如需覆盖默认后端地址，创建 `.env.local`：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

`.env.local` 已加入 `.gitignore`，不会被提交。

## 项目结构

- `app/` — 页面与布局
- `components/` — React 组件
- `lib/` — 工具函数、API 封装、常量、状态管理
- `public/` — 静态资源
- `types/` — 自动生成的 API 类型
