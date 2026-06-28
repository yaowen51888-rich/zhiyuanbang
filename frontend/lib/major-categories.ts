export interface MajorCategory {
  slug: string;
  name: string;
  desc: string;
  majors: string[];
}

export const MAJOR_CATEGORIES: MajorCategory[] = [
  {
    slug: "computer",
    name: "计算机类",
    desc: "聚焦软硬件、人工智能、数据科学等方向，是当前就业最热门的学科门类之一。",
    majors: ["计算机科学与技术", "软件工程", "人工智能", "数据科学与大数据技术", "网络空间安全", "信息安全"],
  },
  {
    slug: "medical",
    name: "医学类",
    desc: "培养临床医师、口腔医师、护理人员、药学研究等医疗卫生人才。",
    majors: ["临床医学", "口腔医学", "护理学", "药学", "中医学", "预防医学"],
  },
  {
    slug: "law",
    name: "法学类",
    desc: "培养法律专业人才，可从事司法、律师、企业法务等。",
    majors: ["法学", "政治学与行政学", "社会学"],
  },
  {
    slug: "business",
    name: "经管类",
    desc: "经济与管理学科，涉及金融、会计、市场营销等。",
    majors: ["金融学", "会计学", "工商管理", "国际经济与贸易"],
  },
  {
    slug: "art",
    name: "艺术设计",
    desc: "覆盖视觉设计、产品设计、动画、影视等创意领域。",
    majors: ["视觉传达设计", "环境设计", "产品设计", "动画"],
  },
  {
    slug: "science",
    name: "理学类",
    desc: "基础学科研究方向，是众多前沿领域的根基。",
    majors: ["数学与应用数学", "物理学", "化学", "生物科学"],
  },
  {
    slug: "engineering",
    name: "工学类",
    desc: "覆盖机械、土木、电子、材料等大量工科专业。",
    majors: ["机械工程", "土木工程", "电子信息工程", "材料科学与工程"],
  },
  {
    slug: "language",
    name: "外语类",
    desc: "外国语言文学专业，培养翻译、跨文化沟通人才。",
    majors: ["英语", "日语", "西班牙语", "翻译"],
  },
];

export function getMajorCategory(slug: string): MajorCategory | undefined {
  return MAJOR_CATEGORIES.find((c) => c.slug === slug);
}
