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
