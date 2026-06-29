# 前端页面设计稿还原方案

## 1. 目标

将 `frontend/` 下的 Next.js 应用首页、推荐页、院校详情页、专业分类页按 `docs/设计稿` 提供的视觉稿进行最大程度还原，统一颜色、布局、组件结构与交互动画。

## 2. 关键决策

| 决策项 | 选择 | 原因 |
|--------|------|------|
| 改造范围 | 全部页面 | 用户要求「先全面还原」 |
| 颜色体系 | 采用设计稿色值 | 最大程度还原 |
| 动画库 | 安装 `motion` | 完整还原滚动入场与悬浮动画 |
| 路由映射 | `/`、`/recommend`、`/schools/[id]`、`/majors/[category]` | 与现有 App Router 对齐 |
| 全局 Header/Footer | 替换现有 Navbar，新增 SiteFooter | 设计稿有完整导航与页脚 |
| 首页静态内容 | 复用设计稿文案与示例数据 | 保持视觉完整，不破坏真实功能 |
| 专业分类 | 采用设计稿 8 个自定义分类 | 视觉还原优先 |
| 移动端菜单 | 用 Radix Dialog 实现抽屉菜单 | 可用 + 无需新依赖 |
| 深色模式 | 删除深色 token，只保留浅色 | 设计稿只有浅色 |

## 3. 主题系统

更新 `frontend/app/globals.css`：

- `--background: #F7FBF9`
- `--primary: #2A9D8F`
- `--primary-foreground: #FFFFFF`
- `--foreground: #1F2A2E`
- `--muted-foreground: #5A6B66`
- `--border: #E3EDE7`
- `--card: #FFFFFF`
- `--secondary: #EAF5F1`
- `--ring: #2A9D8F`

新增 Tailwind 自定义颜色：

- `rush: #F4A261`
- `stable: #2A9D8F`
- `safe: #88B7AC`
- `pad: #9DB5B8`

删除 `.dark` 下所有深色 token。

## 4. 全局布局

- `frontend/components/Navbar.tsx` 被替换为 `frontend/components/SiteHeader.tsx`
- 新增 `frontend/components/SiteFooter.tsx`
- `layout.tsx` 中 `<Navbar />` → `<SiteHeader />`，并在 `<main>` 后加 `<SiteFooter />`
- 页面内容容器统一为 `max-w-7xl mx-auto px-6`
- 移动端菜单使用 `@radix-ui/react-dialog` 做抽屉导航

## 5. 首页 `/`

`app/page.tsx` 组合以下 section 组件：

| 组件 | 来源 | 说明 |
|------|------|------|
| Hero | 设计稿 | 渐变背景、输入条、装饰卡片动画 |
| StatsBanner | 设计稿 | 静态数据展示 |
| FeatureShowcase | 设计稿 | 6 个功能卡片，高亮推荐 |
| HowItWorks | 设计稿 | 四步流程 |
| PopularMajors | 设计稿 | 8 个专业分类 |
| UniversityPreview | 设计稿 | 6 所示例院校 |
| Testimonials | 设计稿 | 3 条用户评价 |
| CTASection | 设计稿 | 底部行动召唤 |

Section 文件统一放到 `frontend/app/sections/`。

Hero 表单提交跳转 `/recommend?province=...&subject=...&score=...`。

## 6. 推荐页 `/recommend`

复用设计稿 `RecommendPage` 布局，但接入真实 API：

- 顶部返回按钮
- 输入卡片：省份、科类、分数、重新生成
- 冲 / 稳 / 保 / 全部 tab
- 结果卡片网格

保留现有 `useMutation` + `/recommend` API 调用。

## 7. 院校详情页 `/schools/[id]`

使用设计稿 `UniversityDetailPage` 布局：

- 顶部返回按钮
- 深色头图区：学校名、档位、概率、标签、所在地、建校年份、类型
- 院校介绍 + 热门专业
- 右侧边栏：录取概率条、参考位次、推荐档位、历年趋势按钮

数据来自现有 `getSchool(id)` API，字段缺失时隐藏对应元素。

## 8. 专业分类页 `/majors/[category]`

新增 `frontend/app/majors/[category]/page.tsx`：

- 返回首页按钮
- 分类名与描述
- 该分类下专业列表网格

分类定义放在 `frontend/lib/major-categories.ts`，包含设计稿 8 个分类的名称、描述、专业列表。

## 9. 动画

安装 `motion` 依赖，用于：

- Hero 装饰卡片悬浮动画
- FeatureShowcase、PopularMajors、UniversityPreview 滚动入场动画
- 按钮与卡片的 hover 过渡

## 10. 响应式

- 桌面端：完整 12 栏布局与装饰元素
- 平板/移动端：网格降为 2 列或 1 列，隐藏部分装饰，汉堡菜单启用抽屉导航

## 11. 依赖变更

新增：

- `motion`（动画）

无需新增：

- `lucide-react` 已安装
- `radix-ui` 已安装
- `tailwindcss` 已安装

## 12. 文件清单

新增/修改：

- `frontend/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/app/recommend/page.tsx`
- `frontend/app/schools/[id]/page.tsx`
- `frontend/app/majors/[category]/page.tsx`
- `frontend/components/SiteHeader.tsx`
- `frontend/components/SiteFooter.tsx`
- `frontend/components/MobileNav.tsx`
- `frontend/app/sections/Hero.tsx`
- `frontend/app/sections/StatsBanner.tsx`
- `frontend/app/sections/FeatureShowcase.tsx`
- `frontend/app/sections/HowItWorks.tsx`
- `frontend/app/sections/PopularMajors.tsx`
- `frontend/app/sections/UniversityPreview.tsx`
- `frontend/app/sections/Testimonials.tsx`
- `frontend/app/sections/CTASection.tsx`
- `frontend/lib/major-categories.ts`
- `frontend/package.json`
- `frontend/package-lock.json`

删除：

- `frontend/components/Navbar.tsx`

## 13. 验收标准

- `npm run dev` 能正常启动
- 首页视觉与设计稿一致（颜色、布局、动画）
- 推荐页能输入分数并调用真实 API 展示结果
- 院校详情页用真实数据渲染设计稿布局
- `/majors/[category]` 能访问并展示对应分类专业
- 移动端汉堡菜单可展开导航
- `npm run build` 通过
