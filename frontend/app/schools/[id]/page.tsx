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
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {school.nature}</span>
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {school.type}</span>
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
                <span className="text-[#16332C]">{lastScore ? `${lastScore.rank.toLocaleString()}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">推荐档位</span>
                <span style={{ color: tierColor, fontWeight: 600 }}>{tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">办学层次</span>
                <span className="text-[#16332C]">{school.level || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">隶属</span>
                <span className="text-[#16332C]">{school.belongs || "—"}</span>
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
