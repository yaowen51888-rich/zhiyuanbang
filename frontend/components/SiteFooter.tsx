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
