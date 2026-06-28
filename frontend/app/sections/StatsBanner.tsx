const stats = [
  { value: "2,800+", label: "覆盖院校" },
  { value: "740+", label: "本科专业" },
  { value: "120万", label: "服务考生" },
  { value: "98.6%", label: "推荐准确率" },
];

export function StatsBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
      <div className="rounded-3xl bg-white border border-[#E3EDE7] shadow-xl shadow-[#2A9D8F]/5 p-2">
        <div className="rounded-2xl bg-gradient-to-br from-[#F7FBF9] to-[#EAF5F1] grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#E3EDE7]">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-8 text-center">
              <div className="text-[#2A9D8F]" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="mt-1 text-sm text-[#6B7F7A]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
