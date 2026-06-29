# 前端页面设计稿还原实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Next.js 前端首页、推荐页、院校详情页、专业分类页按设计稿视觉进行完整还原，统一主题、布局、组件与动画。

**Architecture:** 复用设计稿组件结构与样式，迁移到 Next.js App Router；保留现有 API 调用与状态管理；通过更新 CSS 主题变量让 shadcn 组件自动适配新视觉。

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, motion, lucide-react, radix-ui, TanStack Query, Zustand.

---

## 文件结构

新增/修改文件：

- `frontend/app/globals.css` — 主题色变量更新
- `frontend/app/layout.tsx` — 替换 Navbar 为 SiteHeader，加入 SiteFooter
- `frontend/app/page.tsx` — 组合首页 sections
- `frontend/app/recommend/page.tsx` — 新推荐页布局 + 真实 API
- `frontend/app/schools/[id]/page.tsx` — 新院校详情布局 + 真实 API
- `frontend/app/majors/[category]/page.tsx` — 新增专业分类页
- `frontend/components/SiteHeader.tsx` — 顶部导航
- `frontend/components/SiteFooter.tsx` — 页脚
- `frontend/components/MobileNav.tsx` — 移动端抽屉菜单
- `frontend/app/sections/Hero.tsx`
- `frontend/app/sections/StatsBanner.tsx`
- `frontend/app/sections/FeatureShowcase.tsx`
- `frontend/app/sections/HowItWorks.tsx`
- `frontend/app/sections/PopularMajors.tsx`
- `frontend/app/sections/UniversityPreview.tsx`
- `frontend/app/sections/Testimonials.tsx`
- `frontend/app/sections/CTASection.tsx`
- `frontend/lib/major-categories.ts` — 8 个专业分类映射
- `frontend/package.json` — 添加 motion 依赖
- `frontend/package-lock.json`

删除文件：

- `frontend/components/Navbar.tsx`

---

## Task 1: 更新主题色与依赖

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`（通过 npm install 生成）

- [ ] **Step 1: 添加 motion 依赖**

Run:
```bash
cd frontend
npm install motion
```

- [ ] **Step 2: 替换 globals.css 主题变量**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme {
  --color-mint: #f7fbf9;
  --color-card: #ffffff;
  --color-brand: #2a9d8f;
  --color-brand-dark: #23867a;
  --color-ink: #1f2a2e;
  --color-ink-muted: #5a6b66;
  --color-rush: #f4a261;
  --color-stable: #2a9d8f;
  --color-safe: #88b7ac;
  --color-pad: #9db5b8;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial,
    sans-serif;
}

@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --radius: 0.625rem;
  --background: #f7fbf9;
  --foreground: #1f2a2e;
  --card: #ffffff;
  --card-foreground: #1f2a2e;
  --popover: #ffffff;
  --popover-foreground: #1f2a2e;
  --primary: #2a9d8f;
  --primary-foreground: #ffffff;
  --secondary: #eaf5f1;
  --secondary-foreground: #2a6f66;
  --muted: #f2f8f5;
  --muted-foreground: #5a6b66;
  --accent: #eaf5f1;
  --accent-foreground: #2a6f66;
  --destructive: #ef4444;
  --border: #e3ede7;
  --input: #e3ede7;
  --ring: #2a9d8f;
  --chart-1: #2a9d8f;
  --chart-2: #f4a261;
  --chart-3: #88b7ac;
  --chart-4: #9db5b8;
  --chart-5: #2a6f66;
  --sidebar: #ffffff;
  --sidebar-foreground: #1f2a2e;
  --sidebar-primary: #2a9d8f;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #eaf5f1;
  --sidebar-accent-foreground: #2a6f66;
  --sidebar-border: #e3ede7;
  --sidebar-ring: #2a9d8f;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Step 3: 验证依赖安装**

Run:
```bash
cd frontend
npm ls motion
```
Expected: `motion@^...` 出现在输出中。

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): update theme tokens and add motion dependency"
```

---

## Task 2: 全局 Header/Footer 与 MobileNav

**Files:**
- Create: `frontend/components/SiteHeader.tsx`
- Create: `frontend/components/SiteFooter.tsx`
- Create: `frontend/components/MobileNav.tsx`
- Delete: `frontend/components/Navbar.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: 创建 SiteHeader**

```tsx
import Link from "next/link";
import { Leaf, Menu } from "lucide-react";
import MobileNav from "./MobileNav";

const nav = [
  { label: "学校", href: "/schools" },
  { label: "专业", href: "/majors" },
  { label: "推荐", href: "/recommend" },
  { label: "填报", href: "/fill" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-[#E3EDE7]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#5BB89A] flex items-center justify-center shadow-sm shadow-[#2A9D8F]/20">
            <Leaf className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span className="tracking-wide text-[#2A6F66]" style={{ fontWeight: 600 }}>
            高考志愿帮
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#46615C]">
          {nav.map((n) => (
            <Link key={n.label} href={n.href} className="hover:text-[#2A9D8F] transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex h-9 px-4 items-center rounded-full text-sm text-[#46615C] hover:text-[#2A9D8F] transition-colors">
            登录
          </button>
          <Link
            href="/recommend"
            className="hidden md:inline-flex h-9 px-4 items-center rounded-full text-sm text-white bg-[#2A9D8F] hover:bg-[#23867A] transition-colors shadow-sm shadow-[#2A9D8F]/30"
          >
            免费开始
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 创建 MobileNav**

```tsx
"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const nav = [
  { label: "学校", href: "/schools" },
  { label: "专业", href: "/majors" },
  { label: "推荐", href: "/recommend" },
  { label: "填报", href: "/fill" },
];

export default function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#E3EDE7]">
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1F2A2E]/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between">
            <span className="text-[#16332C] font-semibold">菜单</span>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E3EDE7]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <nav className="mt-8 flex flex-col gap-2">
            {nav.map((n) => (
              <Dialog.Close asChild key={n.label}>
                <Link
                  href={n.href}
                  className="px-4 py-3 rounded-xl text-[#46615C] hover:bg-[#F2F8F5] hover:text-[#2A9D8F] transition-colors"
                >
                  {n.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <button className="h-10 w-full rounded-full border border-[#E3EDE7] text-[#46615C]">
              登录
            </button>
            <Link
              href="/recommend"
              className="h-10 w-full rounded-full bg-[#2A9D8F] text-white inline-flex items-center justify-center hover:bg-[#23867A]"
            >
              免费开始
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: 创建 SiteFooter**

```tsx
import Link from "next/link";
import { Leaf } from "lucide-react";

const cols = [
  {
    title: "产品",
    items: [
      { label: "学校查询", href: "/schools" },
      { label: "专业查询", href: "/majors" },
      { label: "智能推荐", href: "/recommend" },
      { label: "模拟填报", href: "/fill" },
    ],
  },
  {
    title: "资源",
    items: [
      { label: "位次查询", href: "#" },
      { label: "分数线", href: "#" },
      { label: "招生章程", href: "#" },
      { label: "院校百科", href: "#" },
    ],
  },
  {
    title: "关于",
    items: [
      { label: "关于我们", href: "#" },
      { label: "数据来源", href: "#" },
      { label: "用户协议", href: "#" },
      { label: "隐私政策", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E3EDE7] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#5BB89A] flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </span>
            <span className="text-[#2A6F66]" style={{ fontWeight: 600 }}>
              高考志愿帮
            </span>
          </div>
          <p className="mt-4 text-sm text-[#5A6B66] max-w-sm leading-relaxed">
            从容找到适合你的大学。我们用真实数据与严谨算法，让每一位考生都能做出明智的志愿选择。
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{c.title}</div>
            <ul className="mt-4 space-y-2.5">
              {c.items.map((i) => (
                <li key={i.label}>
                  <Link href={i.href} className="text-sm text-[#5A6B66] hover:text-[#2A9D8F] transition-colors">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#EEF5F1]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#7C8F8A]">
          <div>© 2026 高考志愿帮 · 数据更新至 2025 招生季</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#2A9D8F]">ICP 备 2026000000 号</a>
            <a href="#" className="hover:text-[#2A9D8F]">公安备 11000000000000</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: 修改 layout.tsx**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "高考志愿帮 · 智能志愿推荐",
  description: "输入分数，理性匹配冲稳保方案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn(inter.variable, "h-full antialiased font-sans")}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">
          <Providers>{children}</Providers>
        </main>
        <SiteFooter />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: 删除 Navbar.tsx**

```bash
rm frontend/components/Navbar.tsx
```

- [ ] **Step 6: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功，无 Navbar 相关错误。

- [ ] **Step 7: Commit**

```bash
git add frontend/components frontend/app/layout.tsx
rm -f frontend/components/Navbar.tsx
git add -u
git commit -m "feat(frontend): add SiteHeader, SiteFooter, MobileNav; remove old Navbar"
```

---

## Task 3: 专业分类映射

**Files:**
- Create: `frontend/lib/major-categories.ts`

- [ ] **Step 1: 创建分类映射**

```ts
export interface MajorCategory {
  slug: string;
  name: string;
  desc: string;
  majors: string[];
}

export const MAJOR_CATEGORIES: MajorCategory[] = [
  {
    slug: "computer",
    name: "计算机类",
    desc: "聚焦软硬件、人工智能、数据科学等方向，是当前就业最热门的学科门类之一。",
    majors: ["计算机科学与技术", "软件工程", "人工智能", "数据科学与大数据技术", "网络空间安全", "信息安全"],
  },
  {
    slug: "medical",
    name: "医学类",
    desc: "培养临床医师、口腔医师、护理人员、药学研究等医疗卫生人才。",
    majors: ["临床医学", "口腔医学", "护理学", "药学", "中医学", "预防医学"],
  },
  {
    slug: "law",
    name: "法学类",
    desc: "培养法律专业人才，可从事司法、律师、企业法务等。",
    majors: ["法学", "政治学与行政学", "社会学"],
  },
  {
    slug: "business",
    name: "经管类",
    desc: "经济与管理学科，涉及金融、会计、市场营销等。",
    majors: ["金融学", "会计学", "工商管理", "国际经济与贸易"],
  },
  {
    slug: "art",
    name: "艺术设计",
    desc: "覆盖视觉设计、产品设计、动画、影视等创意领域。",
    majors: ["视觉传达设计", "环境设计", "产品设计", "动画"],
  },
  {
    slug: "science",
    name: "理学类",
    desc: "基础学科研究方向，是众多前沿领域的根基。",
    majors: ["数学与应用数学", "物理学", "化学", "生物科学"],
  },
  {
    slug: "engineering",
    name: "工学类",
    desc: "覆盖机械、土木、电子、材料等大量工科专业。",
    majors: ["机械工程", "土木工程", "电子信息工程", "材料科学与工程"],
  },
  {
    slug: "language",
    name: "外语类",
    desc: "外国语言文学专业，培养翻译、跨文化沟通人才。",
    majors: ["英语", "日语", "西班牙语", "翻译"],
  },
];

export function getMajorCategory(slug: string): MajorCategory | undefined {
  return MAJOR_CATEGORIES.find((c) => c.slug === slug);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/lib/major-categories.ts
git commit -m "feat(frontend): add major category mapping"
```

---

## Task 4: 首页 Sections

**Files:**
- Create: `frontend/app/sections/Hero.tsx`
- Create: `frontend/app/sections/StatsBanner.tsx`
- Create: `frontend/app/sections/FeatureShowcase.tsx`
- Create: `frontend/app/sections/HowItWorks.tsx`
- Create: `frontend/app/sections/PopularMajors.tsx`
- Create: `frontend/app/sections/UniversityPreview.tsx`
- Create: `frontend/app/sections/Testimonials.tsx`
- Create: `frontend/app/sections/CTASection.tsx`
- Create: `frontend/app/sections/universities.ts`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: 创建示例院校数据**

```ts
export type Tier = "冲" | "稳" | "保";

export interface University {
  id: string;
  name: string;
  location: string;
  rank: string;
  prob: number;
  tier: Tier;
  tag: string;
}

export const tierStyle: Record<Tier, { color: string; bg: string }> = {
  冲: { color: "#F4A261", bg: "#FCEEDA" },
  稳: { color: "#2A9D8F", bg: "#E6F4EF" },
  保: { color: "#88B7AC", bg: "#EBF3F1" },
};

export const universities: University[] = [
  { id: "cuhk-sz", name: "香港中文大学（深圳）", location: "深圳", rank: "位次 3,859–5,777", prob: 37, tier: "冲", tag: "985 合办" },
  { id: "bnu", name: "北京师范大学", location: "北京", rank: "位次 2,810–7,031", prob: 30, tier: "冲", tag: "985" },
  { id: "xidian", name: "西安电子科技大学", location: "西安", rank: "位次 4,314–5,952", prob: 57, tier: "稳", tag: "211" },
  { id: "sufe", name: "上海财经大学", location: "上海", rank: "位次 1,982–8,970", prob: 44, tier: "稳", tag: "211" },
  { id: "swjtu", name: "西南交通大学", location: "成都", rank: "位次 5,210–7,890", prob: 72, tier: "保", tag: "211" },
  { id: "scu", name: "四川大学", location: "成都", rank: "位次 4,500–6,200", prob: 65, tier: "稳", tag: "985" },
];
```

- [ ] **Step 2: 创建 Hero**

```tsx
"use client";

import { ArrowRight, Sparkles, GraduationCap, Target, TrendingUp, MapPin } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();
  const [province, setProvince] = useState("四川");
  const [subject, setSubject] = useState("理科");
  const [score, setScore] = useState("612");

  const goRecommend = () => {
    router.push(`/recommend?province=${encodeURIComponent(province)}&subject=${encodeURIComponent(subject)}&score=${score}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EAF5F1] via-[#F2F8F5] to-[#F7FBF9]" />
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-[#9FD8C8]/30 blur-3xl" />
        <div className="absolute top-20 -right-32 h-[420px] w-[420px] rounded-full bg-[#D9EAD0]/50 blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#1F2A2E" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-12 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7"
        >
          <div className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/80 border border-[#D7E8DF] text-xs text-[#2A6F66] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#2A9D8F]" />
            2026 高考志愿智能匹配 · 已服务 120 万考生
          </div>

          <h1
            className="mt-6 text-[#16332C] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", fontWeight: 700, lineHeight: 1.1 }}
          >
            从容找到
            <span className="relative inline-block mx-2">
              <span className="relative z-10 text-[#2A9D8F]">适合你</span>
              <span className="absolute left-0 right-0 bottom-1 h-3 bg-[#D9F0E5] -z-0 rounded-sm" />
            </span>
            的大学
          </h1>

          <p className="mt-6 text-[#5A6B66] max-w-xl" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            输入分数，理性匹配 <b className="text-[#2A6F66]">冲 · 稳 · 保</b> 三档方案。
            覆盖全国 2800+ 所院校、740+ 个专业，让每一分都不被浪费。
          </p>

          <div className="mt-9 p-2 rounded-2xl bg-white border border-[#E3EDE7] shadow-xl shadow-[#2A9D8F]/5 max-w-xl">
            <div className="grid grid-cols-12 gap-2">
              <label className="col-span-12 sm:col-span-3 px-3 py-3 rounded-xl bg-[#F2F8F5] block">
                <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">省份</div>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
                >
                  <option>四川</option>
                  <option>北京</option>
                  <option>广东</option>
                  <option>江苏</option>
                </select>
              </label>
              <label className="col-span-12 sm:col-span-3 px-3 py-3 rounded-xl bg-[#F2F8F5] block">
                <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">科类</div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
                >
                  <option>理科</option>
                  <option>文科</option>
                </select>
              </label>
              <label className="col-span-12 sm:col-span-3 px-3 py-3 rounded-xl bg-[#F2F8F5] block">
                <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">分数</div>
                <input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
                />
              </label>
              <button
                onClick={goRecommend}
                className="col-span-12 sm:col-span-3 rounded-xl bg-[#2A9D8F] hover:bg-[#23867A] transition-colors text-white inline-flex items-center justify-center gap-1.5 shadow-md shadow-[#2A9D8F]/30 h-12 sm:h-auto"
              >
                开始推荐 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#6B7F7A]">
            <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#F4A261]" /> 冲刺院校</div>
            <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#2A9D8F]" /> 稳妥院校</div>
            <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#88B7AC]" /> 保底院校</div>
            <span className="hidden sm:inline text-[#B7C7C2]">·</span>
            <span>历年位次法 · 实时数据</span>
          </div>
        </motion.div>

        <div className="lg:col-span-5 relative h-[420px] sm:h-[520px] hidden lg:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[380px] w-[380px] rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#5BB89A] opacity-90 shadow-2xl shadow-[#2A9D8F]/30" />
            <div className="absolute h-[380px] w-[380px] rounded-full border border-white/40" />
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 rounded-2xl bg-white shadow-2xl shadow-[#2A9D8F]/20 p-5"
          >
            <Link href="/schools/5" className="block">
              <div className="flex items-center gap-2 text-xs text-[#7C8F8A]">
                <GraduationCap className="h-4 w-4 text-[#2A9D8F]" /> 推荐匹配
              </div>
              <div className="mt-2 text-[#1F2A2E]" style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                西南交通大学
              </div>
              <div className="mt-1 text-xs text-[#6B7F7A] flex items-center gap-1">
                <MapPin className="h-3 w-3" /> 成都 · 211 · 理工类
              </div>
              <div className="mt-4 h-2 rounded-full bg-[#EEF5F1] overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#2A9D8F] to-[#5BB89A]" />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-[#6B7F7A]">录取概率</span>
                <span className="text-[#2A9D8F]" style={{ fontWeight: 600 }}>72%</span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute top-6 right-4 w-48 rounded-2xl bg-white shadow-xl shadow-[#2A9D8F]/15 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#F4A261]" style={{ fontWeight: 600 }}>
                <Target className="h-3.5 w-3.5" /> 冲
              </div>
              <span className="text-[10px] text-[#7C8F8A]">37%</span>
            </div>
            <div className="mt-2 text-sm text-[#1F2A2E]" style={{ fontWeight: 600 }}>
              香港中文大学（深圳）
            </div>
            <div className="text-[11px] text-[#7C8F8A] mt-1">位次 3,859–5,777</div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute bottom-6 left-0 w-52 rounded-2xl bg-white shadow-xl shadow-[#2A9D8F]/15 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#2A9D8F]" style={{ fontWeight: 600 }}>
                <TrendingUp className="h-3.5 w-3.5" /> 稳
              </div>
              <span className="text-[10px] text-[#7C8F8A]">57%</span>
            </div>
            <div className="mt-2 text-sm text-[#1F2A2E]" style={{ fontWeight: 600 }}>
              西安电子科技大学
            </div>
            <div className="text-[11px] text-[#7C8F8A] mt-1">位次 4,314–5,952</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 创建 StatsBanner**

```tsx
const stats = [
  { value: "2,800+", label: "覆盖院校" },
  { value: "740+", label: "本科专业" },
  { value: "120万", label: "服务考生" },
  { value: "98.6%", label: "推荐准确率" },
];

export function StatsBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
      <div className="rounded-3xl bg-white border border-[#E3EDE7] shadow-xl shadow-[#2A9D8F]/5 p-2">
        <div className="rounded-2xl bg-gradient-to-br from-[#F7FBF9] to-[#EAF5F1] grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#E3EDE7]">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-8 text-center">
              <div className="text-[#2A9D8F]" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="mt-1 text-sm text-[#6B7F7A]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 创建 FeatureShowcase**

```tsx
"use client";

import { School, Target, ClipboardList, BookOpen, LineChart, Compass } from "lucide-react";
import { motion } from "motion/react";

const features = [
  { icon: School, title: "学校查询", desc: "按省份、985/211、类型筛选高校，一键查看历年分数线与位次。", tint: "#2A9D8F", bg: "#E6F4EF", tag: "海量数据" },
  { icon: Target, title: "智能推荐", desc: "基于位次法的「冲稳保」三档方案，匹配录取概率与就业前景。", tint: "#F4A261", bg: "#FCEEDA", tag: "AI 算法", highlight: true },
  { icon: ClipboardList, title: "模拟填报", desc: "拖拽排序你的志愿表，本地保存，多方案对比，随时调整。", tint: "#5BB89A", bg: "#E9F5EE", tag: "可视化" },
  { icon: BookOpen, title: "专业百科", desc: "740+ 专业详解，课程设置、就业方向、薪资数据一目了然。", tint: "#88B7AC", bg: "#EBF3F1" },
  { icon: LineChart, title: "位次分析", desc: "三年位次曲线，识别院校招生波动，避开「大小年」陷阱。", tint: "#2A6F66", bg: "#E1EDE9" },
  { icon: Compass, title: "城市指南", desc: "结合城市发展、生活成本与气候，找到真正适合你的求学之地。", tint: "#9FB89A", bg: "#ECF1E8" },
];

export function FeatureShowcase() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-28">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
        <div>
          <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Features</div>
          <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 }}>
            一站式志愿填报工具集
          </h2>
        </div>
        <p className="max-w-md text-[#5A6B66]">
          从查校、查专业，到智能匹配与模拟填报，我们把每个关键环节都做到了极致简单。
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group relative rounded-3xl p-7 transition-all hover:-translate-y-1 ${
                f.highlight
                  ? "bg-gradient-to-br from-[#16332C] to-[#2A6F66] text-white shadow-xl"
                  : "bg-white border border-[#E3EDE7] hover:shadow-lg hover:border-[#C8DDD3]"
              }`}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: f.highlight ? "rgba(255,255,255,0.12)" : f.bg,
                  color: f.highlight ? "#FFE7C2" : f.tint,
                }}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              {f.tag && (
                <span
                  className="absolute top-7 right-7 text-[10px] px-2 py-0.5 rounded-full tracking-wider"
                  style={{
                    background: f.highlight ? "rgba(255,255,255,0.15)" : f.bg,
                    color: f.highlight ? "#FFE7C2" : f.tint,
                  }}
                >
                  {f.tag}
                </span>
              )}
              <h3 className="mt-6" style={{ fontSize: "1.25rem", fontWeight: 600, color: f.highlight ? "#fff" : "#16332C" }}>
                {f.title}
              </h3>
              <p className="mt-2 leading-relaxed" style={{ color: f.highlight ? "rgba(255,255,255,0.75)" : "#5A6B66", fontSize: "0.9375rem" }}>
                {f.desc}
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm transition-all" style={{ color: f.highlight ? "#FFE7C2" : f.tint }}>
                了解更多
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 创建 HowItWorks**

```tsx
const steps = [
  { n: "01", title: "录入分数信息", desc: "填写省份、科类、高考分数，3 秒完成基本设置。" },
  { n: "02", title: "查看冲稳保方案", desc: "系统基于历年位次自动计算，输出三档推荐院校。" },
  { n: "03", title: "对比专业与城市", desc: "查看专业排名、就业方向、城市发展，全方位评估。" },
  { n: "04", title: "生成志愿表", desc: "拖拽排序、本地保存、随时调整，定稿即可打印。" },
];

export function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F7FBF9] via-[#EAF5F1] to-[#F7FBF9]" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">How it works</div>
          <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700 }}>
            四步，搞定志愿填报
          </h2>
          <p className="mt-4 text-[#5A6B66] max-w-xl mx-auto">
            从输入分数到生成志愿表，平均仅需 15 分钟。无需注册即可体验。
          </p>
        </div>

        <div className="relative grid md:grid-cols-4 gap-6">
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[#C8DDD3]" />
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="relative h-20 w-20 rounded-2xl bg-white border border-[#E3EDE7] mx-auto flex items-center justify-center shadow-sm">
                <span className="text-[#2A9D8F]" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{s.n}</span>
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#2A9D8F]" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-[#16332C]" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>{s.title}</h3>
                <p className="mt-2 text-sm text-[#5A6B66] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 创建 PopularMajors**

```tsx
"use client";

import { Cpu, Stethoscope, Scale, Briefcase, Palette, Atom, Wrench, Globe2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { MAJOR_CATEGORIES } from "@/lib/major-categories";

const iconMap: Record<string, React.ElementType> = {
  computer: Cpu,
  medical: Stethoscope,
  law: Scale,
  business: Briefcase,
  art: Palette,
  science: Atom,
  engineering: Wrench,
  language: Globe2,
};

const colorMap: Record<string, { color: string; bg: string }> = {
  computer: { color: "#2A9D8F", bg: "#E6F4EF" },
  medical: { color: "#F4A261", bg: "#FCEEDA" },
  law: { color: "#5BB89A", bg: "#E9F5EE" },
  business: { color: "#2A6F66", bg: "#E1EDE9" },
  art: { color: "#D67D5C", bg: "#FBE9DF" },
  science: { color: "#88B7AC", bg: "#EBF3F1" },
  engineering: { color: "#16332C", bg: "#E0EBE6" },
  language: { color: "#9FB89A", bg: "#ECF1E8" },
};

export function PopularMajors() {
  return (
    <section id="majors" className="max-w-7xl mx-auto px-6 py-28">
      <div className="text-center mb-14">
        <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Majors</div>
        <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700 }}>
          按门类探索热门专业
        </h2>
        <p className="mt-4 text-[#5A6B66] max-w-xl mx-auto">
          每个学科门类都附带就业方向、薪资分布与课程清单，帮你避开「专业陷阱」。
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MAJOR_CATEGORIES.map((c, i) => {
          const Icon = iconMap[c.slug];
          const style = colorMap[c.slug];
          return (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <Link
                to={`/majors/${c.slug}`}
                className="group block rounded-2xl bg-white border border-[#E3EDE7] p-5 hover:border-[#C8DDD3] hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ background: style.bg, color: style.color }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="text-xs text-[#7C8F8A] mt-0.5">{c.majors.length} 个专业</div>
                  </div>
                  <span className="text-[#2A9D8F] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: 创建 UniversityPreview**

```tsx
"use client";

import { MapPin, Award } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { universities, tierStyle } from "./universities";

const tabs = ["全部", "冲", "稳", "保"];

export function UniversityPreview() {
  return (
    <section id="recommend" className="max-w-7xl mx-auto px-6 py-28">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
        <div>
          <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Recommend</div>
          <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700 }}>
            为你匹配的院校预览
          </h2>
          <p className="mt-3 text-[#5A6B66]">基于四川 · 理科 · 612 分的示例匹配结果</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`h-9 px-4 rounded-full text-sm inline-flex items-center ${
                i === 0
                  ? "bg-[#16332C] text-white"
                  : "bg-white border border-[#E3EDE7] text-[#46615C]"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {universities.map((c, i) => {
          const s = tierStyle[c.tier];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href="/recommend"
                className="group block rounded-3xl bg-white border border-[#E3EDE7] p-6 hover:shadow-xl hover:-translate-y-1 hover:border-[#C8DDD3] transition-all"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="h-7 px-2.5 inline-flex items-center rounded-md text-xs"
                    style={{ background: s.bg, color: s.color, fontWeight: 600 }}
                  >
                    {c.tier} · {c.prob}%
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F8F5] text-[#2A6F66] inline-flex items-center gap-1">
                    <Award className="h-3 w-3" /> {c.tag}
                  </span>
                </div>

                <h3
                  className="mt-5 text-[#16332C] group-hover:text-[#2A9D8F] transition-colors"
                  style={{ fontSize: "1.125rem", fontWeight: 600 }}
                >
                  {c.name}
                </h3>
                <div className="mt-1.5 text-xs text-[#7C8F8A] flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {c.location} · {c.rank}
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs text-[#6B7F7A] mb-1.5">
                    <span>录取概率</span>
                    <span style={{ color: s.color, fontWeight: 600 }}>{c.prob}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#EEF5F1] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${c.prob}%`,
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-[#2A9D8F] group-hover:underline">查看详情</span>
                  <span className="h-8 px-3 inline-flex items-center rounded-lg text-xs bg-[#F2F8F5] text-[#2A6F66]">
                    + 加入志愿表
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 8: 创建 Testimonials**

```tsx
import { Quote, Star } from "lucide-react";

const items = [
  {
    quote: "用三档冲稳保方案对比了一周，最终被「稳」档的第二志愿录取，比预估还多上了 12 分的学校。",
    name: "林同学",
    detail: "2025 · 四川 · 录取 西南交大",
    color: "#2A9D8F",
  },
  {
    quote: "专业百科里就业方向写得很真实，让我从纯看分数转向了「先选专业再挑学校」。",
    name: "陈同学",
    detail: "2025 · 江苏 · 录取 上海财经",
    color: "#F4A261",
  },
  {
    quote: "模拟填报可以拖拽排序，对比了三套方案后给爸妈看，沟通效率高了 10 倍。",
    name: "周同学",
    detail: "2025 · 广东 · 录取 中山大学",
    color: "#5BB89A",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F7FBF9] to-[#EAF5F1]" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Voices</div>
            <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700 }}>
              他们这样说
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5A6B66]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#F4A261] text-[#F4A261]" />
            ))}
            <span className="ml-1"><b className="text-[#16332C]">4.9</b> / 5 · 28,900+ 评价</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div key={t.name} className="rounded-3xl bg-white border border-[#E3EDE7] p-7 relative overflow-hidden">
              <Quote className="absolute -top-2 -right-2 h-24 w-24 text-[#F2F8F5]" strokeWidth={1.2} />
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white relative z-10"
                style={{ background: t.color }}
              >
                <Quote className="h-5 w-5" />
              </div>
              <p className="mt-6 text-[#16332C] relative z-10 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
                "{t.quote}"
              </p>
              <div className="mt-6 pt-5 border-t border-[#EEF5F1] relative z-10">
                <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{t.name}</div>
                <div className="text-xs text-[#7C8F8A] mt-0.5">{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: 创建 CTASection**

```tsx
import { ArrowRight, Leaf } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#16332C] via-[#2A6F66] to-[#2A9D8F] text-white p-12 md:p-16">
        <div className="absolute -top-20 -right-10 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#F4A261]/10 blur-3xl" />
        <svg className="absolute inset-0 opacity-[0.06]" width="100%" height="100%">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3">
            <div className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/10 border border-white/15 text-xs">
              <Leaf className="h-3.5 w-3.5 text-[#FFE7C2]" />
              2026 志愿季 · 完全免费
            </div>
            <h2
              className="mt-5 tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15 }}
            >
              每一分都值得被看见
              <br />
              <span className="text-[#FFE7C2]">现在开始你的推荐</span>
            </h2>
            <p className="mt-5 text-white/75 max-w-lg" style={{ fontSize: "1rem" }}>
              无需注册即可体验全部功能。数据本地保存，隐私零泄漏，安心放心。
            </p>
          </div>

          <div className="md:col-span-2 flex md:justify-end">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Link
                href="/recommend"
                className="h-12 px-7 rounded-full bg-white text-[#16332C] inline-flex items-center justify-center gap-2 hover:bg-[#FFE7C2] transition-colors"
              >
                免费开始推荐 <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="h-12 px-7 rounded-full border border-white/25 text-white hover:bg-white/10 transition-colors">
                查看示例报告
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 10: 修改 app/page.tsx**

```tsx
import { Hero } from "./sections/Hero";
import { StatsBanner } from "./sections/StatsBanner";
import { FeatureShowcase } from "./sections/FeatureShowcase";
import { HowItWorks } from "./sections/HowItWorks";
import { PopularMajors } from "./sections/PopularMajors";
import { UniversityPreview } from "./sections/UniversityPreview";
import { Testimonials } from "./sections/Testimonials";
import { CTASection } from "./sections/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBanner />
      <FeatureShowcase />
      <HowItWorks />
      <PopularMajors />
      <UniversityPreview />
      <Testimonials />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 11: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功。

- [ ] **Step 12: Commit**

```bash
git add frontend/app/sections frontend/app/page.tsx
rm -f frontend/components/Navbar.tsx
git add -u
git commit -m "feat(frontend): add homepage sections from design"
```

---

## Task 5: 推荐页改造

**Files:**
- Modify: `frontend/app/recommend/page.tsx`

- [ ] **Step 1: 替换 recommend/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, MapPin, Award } from "lucide-react";
import {
  ApiError,
  recommend,
  type RecommendItemOut,
  type SubjectType,
} from "@/lib/api";
import {
  SC_PROVINCE_ID,
  PROVINCES,
  SUBJECT_TYPES,
  TIER_ORDER,
  TIER_META,
  type Tier,
} from "@/lib/constants";

const tabs: { key: "all" | Tier; label: string }[] = [
  { key: "all", label: "全部" },
  ...TIER_ORDER.map((t) => ({ key: t, label: TIER_META[t].label })),
];

const tierStyle: Record<Tier, { color: string; bg: string }> = {
  rush: { color: "#F4A261", bg: "#FCEEDA" },
  stable: { color: "#2A9D8F", bg: "#E6F4EF" },
  safe: { color: "#88B7AC", bg: "#EBF3F1" },
  pad: { color: "#9DB5B8", bg: "#E8EFED" },
};

export default function RecommendPage() {
  const [provinceId, setProvinceId] = useState(String(SC_PROVINCE_ID));
  const [subjectType, setSubjectType] = useState<SubjectType>("science");
  const [score, setScore] = useState("");
  const [tab, setTab] = useState<"all" | Tier>("all");

  const mutation = useMutation({
    mutationFn: () =>
      recommend({
        province_id: Number(provinceId),
        subject_type: subjectType,
        score: Number(score),
      }),
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "推荐请求失败"),
  });

  const items: RecommendItemOut[] = mutation.data ?? [];
  const byTier = (t: Tier) => items.filter((i) => i.tier === t);
  const list = tab === "all" ? items : byTier(tab);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sc = Number(score);
    if (!sc || sc < 0 || sc > 750) {
      toast.error("请输入 0–750 之间的分数");
      return;
    }
    mutation.mutate();
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <div className="mt-6 rounded-3xl bg-white border border-[#E3EDE7] shadow-sm p-6">
        <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Recommend</div>
        <h1 className="mt-2 text-[#16332C]" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          智能推荐结果
        </h1>

        <form onSubmit={submit} className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
            <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">省份</div>
            <select
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
            >
              {PROVINCES.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
            <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">科类</div>
            <select
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value as SubjectType)}
              className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
            >
              {SUBJECT_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
            <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">分数</div>
            <input
              type="number"
              min={0}
              max={750}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="如 600"
              className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-[#2A9D8F] hover:bg-[#23867A] disabled:opacity-60 text-white shadow-md shadow-[#2A9D8F]/30"
          >
            {mutation.isPending ? "生成中…" : "重新生成"}
          </button>
        </form>
      </div>

      {mutation.isSuccess && items.length > 0 && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {tabs.map((t) => {
              const count = t.key === "all" ? items.length : byTier(t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-9 px-4 rounded-full text-sm transition-colors ${
                    tab === t.key
                      ? "bg-[#16332C] text-white"
                      : "bg-white border border-[#E3EDE7] text-[#46615C] hover:border-[#2A9D8F] hover:text-[#2A9D8F]"
                  }`}
                >
                  {t.label} {count}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((c) => {
              const s = tierStyle[c.tier];
              return (
                <Link
                  key={c.school_id}
                  href={`/schools/${c.school_id}`}
                  className="group rounded-3xl bg-white border border-[#E3EDE7] p-6 hover:shadow-xl hover:-translate-y-1 hover:border-[#C8DDD3] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="h-7 px-2.5 inline-flex items-center rounded-md text-xs"
                      style={{ background: s.bg, color: s.color, fontWeight: 600 }}
                    >
                      {TIER_META[c.tier].label} · {Math.round(c.probability)}%
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F8F5] text-[#2A6F66] inline-flex items-center gap-1">
                      <Award className="h-3 w-3" /> 推荐
                    </span>
                  </div>
                  <h3
                    className="mt-5 text-[#16332C] group-hover:text-[#2A9D8F] transition-colors"
                    style={{ fontSize: "1.125rem", fontWeight: 600 }}
                  >
                    {c.name}
                  </h3>
                  <div className="mt-1.5 text-xs text-[#7C8F8A] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {c.province_name || ""} · {c.rank ? `位次 ${c.rank}` : "位次 —"}
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-[#6B7F7A] mb-1.5">
                      <span>录取概率</span>
                      <span style={{ color: s.color, fontWeight: 600 }}>{Math.round(c.probability)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#EEF5F1] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.probability}%`,
                          background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {mutation.isPending && (
        <p className="mt-10 text-center text-[#6B7F7A]">生成中…</p>
      )}
      {mutation.isError && (
        <p className="mt-10 text-center text-destructive">生成失败，请调整输入后重试</p>
      )}
      {mutation.isSuccess && items.length === 0 && (
        <p className="mt-10 text-center text-[#6B7F7A]">没有匹配的推荐结果</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add frontend/app/recommend/page.tsx
git commit -m "feat(frontend): redesign recommend page with design layout"
```

---

## Task 6: 院校详情页改造

**Files:**
- Modify: `frontend/app/schools/[id]/page.tsx`

- [ ] **Step 1: 替换 schools/[id]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { EChartsOption } from "echarts";
import { ArrowLeft, MapPin, Award, Calendar, GraduationCap, TrendingUp } from "lucide-react";
import { ApiError, getSchool } from "@/lib/api";
import EChart from "@/components/EChart";
import AddToWishlistButton from "@/components/AddToWishlistButton";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let school: Awaited<ReturnType<typeof getSchool>> | undefined;
  try {
    school = await getSchool(Number(id));
  } catch (e) {
    if (e instanceof ApiError && e.code === 404) notFound();
    throw e;
  }
  if (!school) notFound();

  const scores = [...school.history_scores].sort((a, b) => a.year - b.year);
  const chartOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["录取最低分", "录取位次"], top: 0 },
    grid: { left: 8, right: 8, bottom: 8, top: 36, containLabel: true },
    xAxis: { type: "category", data: scores.map((s) => String(s.year)) },
    yAxis: [
      { type: "value", name: "分数", scale: true },
      { type: "value", name: "位次", scale: true },
    ],
    series: [
      {
        name: "录取最低分",
        type: "line",
        smooth: true,
        data: scores.map((s) => s.score),
        itemStyle: { color: "#2A9D8F" },
        lineStyle: { color: "#2A9D8F" },
      },
      {
        name: "录取位次",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: scores.map((s) => s.rank),
        itemStyle: { color: "#F4A261" },
        lineStyle: { color: "#F4A261" },
      },
    ],
  };

  const lastScore = scores[scores.length - 1];
  const prob = lastScore ? Math.min(95, Math.max(10, Math.round(100 - (lastScore.rank / 10000)))) : 50;
  const tier = prob >= 70 ? "保" : prob >= 45 ? "稳" : "冲";
  const tierColor = prob >= 70 ? "#88B7AC" : prob >= 45 ? "#2A9D8F" : "#F4A261";

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <Link
        href="/schools"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回学校列表
      </Link>

      <div className="mt-6 rounded-3xl overflow-hidden border border-[#E3EDE7] bg-white">
        <div className="relative h-56 md:h-48 bg-gradient-to-br from-[#16332C] via-[#2A6F66] to-[#2A9D8F] p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="d" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="#fff" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#d)" />
            </svg>
          </div>
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span
                className="h-7 px-2.5 inline-flex items-center rounded-md text-xs bg-white/15 backdrop-blur"
                style={{ fontWeight: 600 }}
              >
                {tier} 档 · 录取概率 {prob}%
              </span>
              <h1 className="mt-3" style={{ fontSize: "2rem", fontWeight: 700 }}>{school.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[school.province, school.city].filter(Boolean).join(" · ")}</span>
                <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {[school.is_985 && "985", school.is_211 && "211"].filter(Boolean).join("/") || school.type}</span>
                {school.founded && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 建校 {school.founded}</span>}
                {school.type && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {school.type}</span>}
              </div>
            </div>
            <div className="hidden md:block">
              <AddToWishlistButton item={{ school_id: school.school_id, name: school.name }} />
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-[#16332C]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>院校介绍</h2>
            <p className="mt-3 text-[#5A6B66] leading-relaxed">{school.intro || "暂无院校介绍"}</p>

            <h2 className="mt-8 text-[#16332C]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>历年分数线</h2>
            <div className="mt-3 rounded-2xl border border-[#E3EDE7] p-4 bg-[#F7FBF9]">
              {scores.length > 0 ? (
                <EChart option={chartOption} className="h-72" />
              ) : (
                <p className="py-10 text-center text-sm text-[#7C8F8A]">暂无历年分数线数据</p>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#E3EDE7] p-5 bg-[#F7FBF9] h-fit">
            <div className="text-xs text-[#7C8F8A]">录取数据</div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-[#46615C] mb-1.5">
                <span>录取概率</span>
                <span style={{ color: tierColor, fontWeight: 700 }}>{prob}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EEF5F1] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${prob}%`, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}cc)` }} />
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">参考位次</span>
                <span className="text-[#16332C]">{lastScore ? `${lastScore.rank}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">推荐档位</span>
                <span style={{ color: tierColor, fontWeight: 600 }}>{tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">办学层次</span>
                <span className="text-[#16332C]">{school.level || "—"}</span>
              </div>
            </div>
            <div className="mt-6 md:hidden">
              <AddToWishlistButton item={{ school_id: school.school_id, name: school.name }} />
            </div>
            <button className="mt-6 w-full h-10 rounded-xl bg-[#2A9D8F] hover:bg-[#23867A] text-white text-sm inline-flex items-center justify-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> 查看历年趋势
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add frontend/app/schools/\[id\]/page.tsx
git commit -m "feat(frontend): redesign school detail page with design layout"
```

---

## Task 7: 专业分类页

**Files:**
- Create: `frontend/app/majors/[category]/page.tsx`

- [ ] **Step 1: 创建专业分类页**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMajorCategory } from "@/lib/major-categories";

export default async function MajorCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = getMajorCategory(category);
  if (!c) notFound();

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <Link
        href="/majors"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回专业列表
      </Link>

      <div className="mt-6">
        <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Major Category</div>
        <h1 className="mt-2 text-[#16332C]" style={{ fontSize: "2rem", fontWeight: 700 }}>{c.name}</h1>
        <p className="mt-3 text-[#5A6B66] max-w-2xl leading-relaxed">{c.desc}</p>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.majors.map((m) => (
            <div key={m} className="rounded-2xl bg-white border border-[#E3EDE7] p-5 hover:shadow-md transition-shadow">
              <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{m}</div>
              <div className="mt-1 text-xs text-[#7C8F8A]">查看课程设置 · 就业方向 · 薪资分布</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add frontend/app/majors/\[category\]/page.tsx
git commit -m "feat(frontend): add major category page"
```

---

## Task 8: 现有页面样式适配

**Files:**
- Modify: `frontend/app/schools/page.tsx`
- Modify: `frontend/app/majors/page.tsx`
- Modify: `frontend/app/fill/page.tsx`
- Modify: `frontend/components/RecommendItemCard.tsx`（如存在）
- Modify: `frontend/components/SchoolCard.tsx`

- [ ] **Step 1: 调整 Schools/Majors/Fill 页面容器**

将 `frontend/app/schools/page.tsx`、
`frontend/app/majors/page.tsx`、
`frontend/app/fill/page.tsx` 中的 `max-w-5xl px-4` 替换为 `max-w-7xl px-6`。

- [ ] **Step 2: 调整 SchoolCard 颜色**

将 `frontend/components/SchoolCard.tsx` 中所有旧品牌色 `#4fb3a9` / `text-brand` / `bg-brand` 替换为新主题变量 `text-primary`、`bg-primary`、`text-foreground` 等，或直接使用 Tailwind 语义类名如 `text-primary`、`bg-primary/15`。

- [ ] **Step 3: 运行构建检查**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功。

- [ ] **Step 4: Commit**

```bash
git add frontend/app/schools/page.tsx frontend/app/majors/page.tsx frontend/app/fill/page.tsx frontend/components/SchoolCard.tsx
git commit -m "style(frontend): adapt existing pages to new design container and colors"
```

---

## Task 9: 最终验证

**Files:**
- 无新增/修改

- [ ] **Step 1: 运行完整构建**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功，无 TypeScript 错误。

- [ ] **Step 2: 运行 Lint**

Run:
```bash
cd frontend
npm run lint
```
Expected: lint 通过。

- [ ] **Step 3: 启动开发服务器并手动检查**

Run:
```bash
cd frontend
npm run dev
```

打开 http://localhost:3000，检查：
- 首页视觉与设计稿一致
- 导航、移动端菜单可用
- 推荐页输入分数能调用 API
- 院校详情页展示真实数据
- `/majors/computer` 能展示专业分类

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(frontend): complete frontend redesign to match design files"
```

---

## 自我审查

- **Spec coverage:** 主题系统、全局布局、首页 sections、推荐页、院校详情页、专业分类页、动画依赖、响应式、现有页面适配均有对应 task。
- **Placeholder scan:** 无 TBD/TODO，所有代码步骤包含完整代码。
- **Type consistency:** `RecommendItemOut`、`SubjectType`、`Tier` 等类型与现有 `lib/api.ts`、`lib/constants.ts` 一致；`major-categories.ts` 中的 `slug` 与 `PopularMajors`、`/majors/[category]` 一致。
