import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const categoryMap: Record<string, { name: string; majors: string[]; desc: string }> = {
  computer: {
    name: "计算机类",
    desc: "聚焦软硬件、人工智能、数据科学等方向，是当前就业最热门的学科门类之一。",
    majors: ["计算机科学与技术", "软件工程", "人工智能", "数据科学与大数据技术", "网络空间安全", "信息安全"],
  },
  medical: {
    name: "医学类",
    desc: "培养临床医师、口腔医师、护理人员、药学研究等医疗卫生人才。",
    majors: ["临床医学", "口腔医学", "护理学", "药学", "中医学", "预防医学"],
  },
  law: { name: "法学类", desc: "培养法律专业人才，可从事司法、律师、企业法务等。", majors: ["法学", "政治学与行政学", "社会学"] },
  business: { name: "经管类", desc: "经济与管理学科，涉及金融、会计、市场营销等。", majors: ["金融学", "会计学", "工商管理", "国际经济与贸易"] },
  art: { name: "艺术设计", desc: "覆盖视觉设计、产品设计、动画、影视等创意领域。", majors: ["视觉传达设计", "环境设计", "产品设计", "动画"] },
  science: { name: "理学类", desc: "基础学科研究方向，是众多前沿领域的根基。", majors: ["数学与应用数学", "物理学", "化学", "生物科学"] },
  engineering: { name: "工学类", desc: "覆盖机械、土木、电子、材料等大量工科专业。", majors: ["机械工程", "土木工程", "电子信息工程", "材料科学与工程"] },
  language: { name: "外语类", desc: "外国语言文学专业，培养翻译、跨文化沟通人才。", majors: ["英语", "日语", "西班牙语", "翻译"] },
};

export function MajorCategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const c = category ? categoryMap[category] : undefined;

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </button>

      {!c ? (
        <h1 className="mt-10 text-[#16332C]" style={{ fontSize: "1.5rem", fontWeight: 600 }}>未找到该门类</h1>
      ) : (
        <div className="mt-6">
          <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Major Category</div>
          <h1 className="mt-2 text-[#16332C]" style={{ fontSize: "2rem", fontWeight: 700 }}>{c.name}</h1>
          <p className="mt-3 text-[#5A6B66] max-w-2xl leading-relaxed">{c.desc}</p>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {c.majors.map((m) => (
              <div key={m} className="rounded-2xl bg-white border border-[#E3EDE7] p-5 hover:shadow-md transition-shadow">
                <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{m}</div>
                <div className="mt-1 text-xs text-[#7C8F8A]">查看课程设置 · 就业方向 · 薪资分布</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
