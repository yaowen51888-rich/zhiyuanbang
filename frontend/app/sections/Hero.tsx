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
