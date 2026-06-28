import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMajorCategory } from "@/lib/major-categories";

export default async function MajorCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = getMajorCategory(category);
  if (!c) notFound();

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <Link
        href="/majors"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A6B66] hover:text-[#2A9D8F]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回专业列表
      </Link>

      <div className="mt-6">
        <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">Major Category</div>
        <h1 className="mt-2 text-[#16332C]" style={{ fontSize: "2rem", fontWeight: 700 }}>{c.name}</h1>
        <p className="mt-3 text-[#5A6B66] max-w-2xl leading-relaxed">{c.desc}</p>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.majors.map((m) => (
            <div key={m} className="rounded-2xl bg-white border border-[#E3EDE7] p-5 hover:shadow-md transition-shadow">
              <div className="text-[#16332C]" style={{ fontWeight: 600 }}>{m}</div>
              <div className="mt-1 text-xs text-[#7C8F8A]">查看课程设置 · 就业方向 · 薪资分布</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
