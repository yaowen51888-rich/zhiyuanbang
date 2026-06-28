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
                href={`/majors/${c.slug}`}
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
