import { Quote, Star } from "lucide-react";

const items = [
  {
    quote:
      "用三档冲稳保方案对比了一周，最终被「稳」档的第二志愿录取，比预估还多上了 12 分的学校。",
    name: "林同学",
    detail: "2025 · 四川 · 录取 西南交大",
    color: "#2A9D8F",
  },
  {
    quote:
      "专业百科里就业方向写得很真实，让我从纯看分数转向了「先选专业再挑学校」。",
    name: "陈同学",
    detail: "2025 · 江苏 · 录取 上海财经",
    color: "#F4A261",
  },
  {
    quote:
      "模拟填报可以拖拽排序，对比了三套方案后给爸妈看，沟通效率高了 10 倍。",
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
                &ldquo;{t.quote}&rdquo;
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
