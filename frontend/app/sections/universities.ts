export type Tier = "冲" | "稳" | "保";

export interface University {
  id: string;
  name: string;
  location: string;
  rank: string;
  prob: number;
  tier: Tier;
  tag: string;
}

export const tierStyle: Record<Tier, { color: string; bg: string }> = {
  冲: { color: "#F4A261", bg: "#FCEEDA" },
  稳: { color: "#2A9D8F", bg: "#E6F4EF" },
  保: { color: "#88B7AC", bg: "#EBF3F1" },
};

export const universities: University[] = [
  { id: "cuhk-sz", name: "香港中文大学（深圳）", location: "深圳", rank: "位次 3,859–5,777", prob: 37, tier: "冲", tag: "985 合办" },
  { id: "bnu", name: "北京师范大学", location: "北京", rank: "位次 2,810–7,031", prob: 30, tier: "冲", tag: "985" },
  { id: "xidian", name: "西安电子科技大学", location: "西安", rank: "位次 4,314–5,952", prob: 57, tier: "稳", tag: "211" },
  { id: "sufe", name: "上海财经大学", location: "上海", rank: "位次 1,982–8,970", prob: 44, tier: "稳", tag: "211" },
  { id: "seu", name: "东南大学", location: "南京", rank: "位次 5,210–7,890", prob: 72, tier: "保", tag: "985" },
  { id: "nju", name: "南京大学", location: "南京", rank: "位次 4,500–6,200", prob: 65, tier: "稳", tag: "985" },
];
