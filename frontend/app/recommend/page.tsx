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

function formatRank(rankMin: number, rankMax: number): string {
  return `位次 ${rankMin.toLocaleString()}–${rankMax.toLocaleString()}`;
}

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

      {mutation.isPending && (
        <p className="mt-10 text-center text-[#6B7F7A]">生成中…</p>
      )}
      {mutation.isError && (
        <p className="mt-10 text-center text-destructive">生成失败，请调整输入后重试</p>
      )}
      {mutation.isSuccess && items.length === 0 && (
        <p className="mt-10 text-center text-[#6B7F7A]">没有匹配的推荐结果</p>
      )}

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
              const tierKey = c.tier as Tier;
              const s = tierStyle[tierKey] ?? tierStyle.pad;
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
                      {TIER_META[tierKey]?.label ?? c.tier} · {Math.round(c.probability)}%
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F8F5] text-[#2A6F66] inline-flex items-center gap-1">
                      <Award className="h-3 w-3" /> 推荐
                    </span>
                  </div>
                  <h3
                    className="mt-5 text-[#16332C] group-hover:text-[#2A9D8F] transition-colors"
                    style={{ fontSize: "1.125rem", fontWeight: 600 }}
                  >
                    {c.school_name}
                  </h3>
                  <div className="mt-1.5 text-xs text-[#7C8F8A] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {formatRank(c.rank_min, c.rank_max)}
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
    </section>
  );
}
