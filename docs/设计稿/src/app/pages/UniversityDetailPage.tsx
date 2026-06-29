import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, MapPin, Award, Calendar, GraduationCap, TrendingUp } from "lucide-react";
import { getUniversity, tierStyle } from "../data/universities";

export function UniversityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u = id ? getUniversity(id) : undefined;

  if (!u) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-[#16332C]" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          未找到院校
        </h1>
        <Link to="/" className="mt-4 inline-block text-[#2A9D8F]">返回首页</Link>
      </section>
    );
  }

  const s = tierStyle[u.tier];

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="mt-6 rounded-3xl overflow-hidden border border-[#E3EDE7] bg-white">
        <div className="relative h-48 bg-gradient-to-br from-[#16332C] via-[#2A6F66] to-[#2A9D8F] p-8 text-white">
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
          <div className="relative flex items-start justify-between">
            <div>
              <span
                className="h-7 px-2.5 inline-flex items-center rounded-md text-xs bg-white/15 backdrop-blur"
                style={{ fontWeight: 600 }}
              >
                {u.tier} 档 · 录取概率 {u.prob}%
              </span>
              <h1 className="mt-3" style={{ fontSize: "2rem", fontWeight: 700 }}>{u.name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {u.location}</span>
                <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {u.tag}</span>
                {u.founded && (
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 建校 {u.founded}</span>
                )}
                {u.type && (
                  <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {u.type}</span>
                )}
              </div>
            </div>
            <button className="hidden md:inline-flex h-10 px-5 rounded-full bg-white text-[#16332C] text-sm hover:bg-[#FFE7C2] transition-colors">
              + 加入志愿表
            </button>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-[#16332C]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>院校介绍</h2>
            <p className="mt-3 text-[#5A6B66] leading-relaxed">{u.intro}</p>

            <h2 className="mt-8 text-[#16332C]" style={{ fontSize: "1.125rem", fontWeight: 600 }}>热门专业</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {u.hotMajors?.map((m) => (
                <span key={m} className="px-3 py-1.5 rounded-full bg-[#F2F8F5] text-[#2A6F66] text-sm border border-[#E3EDE7]">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#E3EDE7] p-5 bg-[#F7FBF9] h-fit">
            <div className="text-xs text-[#7C8F8A]">录取数据</div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-[#46615C] mb-1.5">
                <span>录取概率</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{u.prob}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EEF5F1] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${u.prob}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                  }}
                />
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">参考位次</span>
                <span className="text-[#16332C]">{u.rank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8F8A]">推荐档位</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{u.tier}</span>
              </div>
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
