const steps = [
  { n: "01", title: "录入分数信息", desc: "填写省份、科类、高考分数，3 秒完成基本设置。" },
  { n: "02", title: "查看冲稳保方案", desc: "系统基于历年位次自动计算，输出三档推荐院校。" },
  { n: "03", title: "对比专业与城市", desc: "查看专业排名、就业方向、城市发展，全方位评估。" },
  { n: "04", title: "生成志愿表", desc: "拖拽排序、本地保存、随时调整，定稿即可打印。" },
];

export function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F7FBF9] via-[#EAF5F1] to-[#F7FBF9]" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.2em] text-[#2A9D8F] uppercase">How it works</div>
          <h2 className="mt-3 text-[#16332C]" style={{ fontSize: "2.25rem", fontWeight: 700 }}>
            四步，搞定志愿填报
          </h2>
          <p className="mt-4 text-[#5A6B66] max-w-xl mx-auto">
            从输入分数到生成志愿表，平均仅需 15 分钟。无需注册即可体验。
          </p>
        </div>

        <div className="relative grid md:grid-cols-4 gap-6">
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[#C8DDD3]" />
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="relative h-20 w-20 rounded-2xl bg-white border border-[#E3EDE7] mx-auto flex items-center justify-center shadow-sm">
                <span className="text-[#2A9D8F]" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{s.n}</span>
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#2A9D8F]" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-[#16332C]" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>{s.title}</h3>
                <p className="mt-2 text-sm text-[#5A6B66] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
