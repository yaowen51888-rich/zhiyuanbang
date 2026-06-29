import { useSearchParams, useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import { MapPin, Award, ArrowLeft } from "lucide-react";
import { universities, tierStyle } from "../data/universities";

const tabs = ["全部", "冲", "稳", "保"] as const;

export function RecommendPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [province, setProvince] = useState(params.get("province") ?? "四川");
  const [subject, setSubject] = useState(params.get("subject") ?? "理科");
  const [score, setScore] = useState(params.get("score") ?? "612");
  const [tab, setTab] = useState<typeof tabs[number]>("全部");

  useEffect(() => {
    setParams({ province, subject, score });
  }, [province, subject, score, setParams]);

  const list = tab === "全部" ? universities : universities.filter((u) => u.tier === tab);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </button>

      <div className="mt-6 rounded-3xl bg-white border border-[#E3EDE7] shadow-sm p-6">
        <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Recommend</div>
        <h1 className="mt-2 text-[#16332C]" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          智能推荐结果
        </h1>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
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
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
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
          <label className="px-4 py-3 rounded-xl bg-[#F2F8F5] block">
            <div className="text-[10px] tracking-wider text-[#7C8F8A] uppercase">分数</div>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full bg-transparent outline-none text-[#1F2A2E] mt-0.5"
            />
          </label>
          <button className="rounded-xl bg-[#2A9D8F] hover:bg-[#23867A] text-white shadow-md shadow-[#2A9D8F]/30">
            重新生成
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-9 px-4 rounded-full text-sm transition-colors ${
              tab === t
                ? "bg-[#16332C] text-white"
                : "bg-white border border-[#E3EDE7] text-[#46615C] hover:border-[#2A9D8F] hover:text-[#2A9D8F]"
            }`}
          >
            {t} {t !== "全部" && `(${universities.filter((u) => u.tier === t).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((c) => {
          const s = tierStyle[c.tier];
          return (
            <Link
              key={c.id}
              to={`/university/${c.id}`}
              className="group rounded-3xl bg-white border border-[#E3EDE7] p-6 hover:shadow-xl hover:-translate-y-1 hover:border-[#C8DDD3] transition-all"
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
                    className="h-full rounded-full"
                    style={{
                      width: `${c.prob}%`,
                      background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
