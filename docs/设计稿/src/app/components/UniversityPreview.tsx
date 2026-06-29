import { MapPin, Award } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { universities, tierStyle } from "../data/universities";

const tabs = ["全部 1115", "冲 3", "稳 2", "保 4", "垫 1106"];

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
            <button
              key={t}
              className={`h-9 px-4 rounded-full text-sm transition-colors ${
                i === 0
                  ? "bg-[#16332C] text-white"
                  : "bg-white border border-[#E3EDE7] text-[#46615C] hover:border-[#2A9D8F] hover:text-[#2A9D8F]"
              }`}
            >
              {t}
            </button>
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
                to={`/university/${c.id}`}
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
