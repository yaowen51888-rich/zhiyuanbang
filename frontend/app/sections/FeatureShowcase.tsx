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
