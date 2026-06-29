import { Leaf, Menu } from "lucide-react";

const nav = [
  { label: "学校", href: "#schools" },
  { label: "专业", href: "#majors" },
  { label: "推荐", href: "#recommend" },
  { label: "填报", href: "#apply" },
  { label: "资讯", href: "#news" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-[#E3EDE7]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#5BB89A] flex items-center justify-center shadow-sm shadow-[#2A9D8F]/20">
            <Leaf className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span className="tracking-wide text-[#2A6F66]" style={{ fontWeight: 600 }}>
            高考志愿帮
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#46615C]">
          {nav.map((n) => (
            <a key={n.label} href={n.href} className="hover:text-[#2A9D8F] transition-colors">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex h-9 px-4 items-center rounded-full text-sm text-[#46615C] hover:text-[#2A9D8F] transition-colors">
            登录
          </button>
          <button className="h-9 px-4 inline-flex items-center rounded-full text-sm text-white bg-[#2A9D8F] hover:bg-[#23867A] transition-colors shadow-sm shadow-[#2A9D8F]/30">
            免费开始
          </button>
          <button className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#E3EDE7]">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
