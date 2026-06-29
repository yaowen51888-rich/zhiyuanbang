export type Tier = "冲" | "稳" | "保";

export interface University {
  id: string;
  name: string;
  location: string;
  rank: string;
  prob: number;
  tier: Tier;
  tag: string;
  intro?: string;
  founded?: number;
  type?: string;
  hotMajors?: string[];
}

export const tierStyle: Record<Tier, { color: string; bg: string }> = {
  冲: { color: "#F4A261", bg: "#FCEEDA" },
  稳: { color: "#2A9D8F", bg: "#E6F4EF" },
  保: { color: "#88B7AC", bg: "#EBF3F1" },
};

export const universities: University[] = [
  {
    id: "cuhk-sz",
    name: "香港中文大学（深圳）",
    location: "深圳",
    rank: "位次 3,859–5,777",
    prob: 37,
    tier: "冲",
    tag: "985 合办",
    founded: 2014,
    type: "综合类",
    intro: "中外合办高水平研究型大学，承袭香港中文大学学术体系，国际化氛围浓厚。",
    hotMajors: ["计算机科学与技术", "金融学", "经济学", "数据科学"],
  },
  {
    id: "bnu",
    name: "北京师范大学",
    location: "北京",
    rank: "位次 2,810–7,031",
    prob: 30,
    tier: "冲",
    tag: "985",
    founded: 1902,
    type: "师范类",
    intro: "教师教育、教育科学、文理基础学科领域具有领先地位的综合性研究型大学。",
    hotMajors: ["心理学", "教育学", "汉语言文学", "数学"],
  },
  {
    id: "xidian",
    name: "西安电子科技大学",
    location: "西安",
    rank: "位次 4,314–5,952",
    prob: 57,
    tier: "稳",
    tag: "211",
    founded: 1931,
    type: "理工类",
    intro: "以信息与电子学科为主，在通信、计算机、人工智能等领域处于国内领先地位。",
    hotMajors: ["通信工程", "电子信息工程", "计算机科学与技术", "人工智能"],
  },
  {
    id: "sufe",
    name: "上海财经大学",
    location: "上海",
    rank: "位次 1,982–8,970",
    prob: 44,
    tier: "稳",
    tag: "211",
    founded: 1917,
    type: "财经类",
    intro: "国内财经类高校的佼佼者，金融、会计、统计等专业实力雄厚。",
    hotMajors: ["金融学", "会计学", "统计学", "经济学"],
  },
  {
    id: "swjtu",
    name: "西南交通大学",
    location: "成都",
    rank: "位次 5,210–7,890",
    prob: 72,
    tier: "保",
    tag: "211",
    founded: 1896,
    type: "理工类",
    intro: "轨道交通领域世界知名学府，土木、机械、交通运输专业全国领先。",
    hotMajors: ["土木工程", "交通运输", "机械工程", "电气工程"],
  },
  {
    id: "scu",
    name: "四川大学",
    location: "成都",
    rank: "位次 4,500–6,200",
    prob: 65,
    tier: "稳",
    tag: "985",
    founded: 1896,
    type: "综合类",
    intro: "西部地区综合实力顶尖的研究型大学，学科覆盖完整，医工文理兼具。",
    hotMajors: ["口腔医学", "临床医学", "高分子材料", "新闻学"],
  },
];

export function getUniversity(id: string) {
  return universities.find((u) => u.id === id);
}
