/** 全站常量：省份、科类、档位视觉映射（spec §8.4 配色） */

/** 默认生源省：江苏（新高考 3+1+2） */
export const DEFAULT_PROVINCE_ID = 32;

/** 高考模式：老高考文理 / 新高考 3+3 / 新高考 3+1+2 */
export type GaokaoType = "old" | "new_3_3" | "new_3_1_2";

export interface Province {
  id: number;
  name: string;
  gaokaoType: GaokaoType;
}

/**
 * 全国 31 省（province_id 取国标 GB/T 2260 前 2 位，与后端爬虫 PROVINCES 字典一致）。
 * gaokaoType 决定该省可选科类。
 */
export const PROVINCES: Province[] = [
  { id: 11, name: "北京", gaokaoType: "new_3_3" },
  { id: 12, name: "天津", gaokaoType: "new_3_3" },
  { id: 13, name: "河北", gaokaoType: "new_3_1_2" },
  { id: 14, name: "山西", gaokaoType: "old" },
  { id: 15, name: "内蒙古", gaokaoType: "new_3_1_2" },
  { id: 21, name: "辽宁", gaokaoType: "new_3_1_2" },
  { id: 22, name: "吉林", gaokaoType: "new_3_1_2" },
  { id: 23, name: "黑龙江", gaokaoType: "new_3_1_2" },
  { id: 31, name: "上海", gaokaoType: "new_3_3" },
  { id: 32, name: "江苏", gaokaoType: "new_3_1_2" },
  { id: 33, name: "浙江", gaokaoType: "new_3_3" },
  { id: 34, name: "安徽", gaokaoType: "new_3_1_2" },
  { id: 35, name: "福建", gaokaoType: "new_3_1_2" },
  { id: 36, name: "江西", gaokaoType: "new_3_1_2" },
  { id: 37, name: "山东", gaokaoType: "new_3_3" },
  { id: 41, name: "河南", gaokaoType: "old" },
  { id: 42, name: "湖北", gaokaoType: "new_3_1_2" },
  { id: 43, name: "湖南", gaokaoType: "new_3_1_2" },
  { id: 44, name: "广东", gaokaoType: "new_3_1_2" },
  { id: 45, name: "广西", gaokaoType: "new_3_1_2" },
  { id: 46, name: "海南", gaokaoType: "new_3_3" },
  { id: 50, name: "重庆", gaokaoType: "new_3_1_2" },
  { id: 51, name: "四川", gaokaoType: "old" },
  { id: 52, name: "贵州", gaokaoType: "old" },
  { id: 53, name: "云南", gaokaoType: "old" },
  { id: 54, name: "西藏", gaokaoType: "old" },
  { id: 61, name: "陕西", gaokaoType: "old" },
  { id: 62, name: "甘肃", gaokaoType: "new_3_1_2" },
  { id: 63, name: "青海", gaokaoType: "old" },
  { id: 64, name: "宁夏", gaokaoType: "old" },
  { id: 65, name: "新疆", gaokaoType: "old" },
];

export interface SubjectOption {
  value: string;
  label: string;
}

/** 高考模式 → 可选科类（value 对齐后端 SubjectType 枚举） */
const SUBJECTS_BY_GAOKAO: Record<GaokaoType, SubjectOption[]> = {
  old: [
    { value: "science", label: "理科" },
    { value: "liberal", label: "文科" },
  ],
  new_3_1_2: [
    { value: "physics", label: "物理类" },
    { value: "history", label: "历史类" },
  ],
  new_3_3: [{ value: "comprehensive", label: "综合" }],
};

/** 取某高考模式下的可选科类 */
export function subjectsFor(gaokaoType: GaokaoType): SubjectOption[] {
  return SUBJECTS_BY_GAOKAO[gaokaoType];
}

/** 省份 id → 名称 */
export function provinceName(id: number): string {
  return PROVINCES.find((p) => p.id === id)?.name ?? "";
}

export type Tier = "rush" | "stable" | "safe" | "pad";

/** 档位 → 展示元数据（label + Tailwind 文字/底色，完整字符串以便 JIT 扫描） */
export const TIER_META: Record<Tier, { label: string; text: string; bg: string }> = {
  rush: { label: "冲", text: "text-rush", bg: "bg-rush/15" },
  stable: { label: "稳", text: "text-stable", bg: "bg-stable/15" },
  safe: { label: "保", text: "text-safe", bg: "bg-safe/15" },
  pad: { label: "垫", text: "text-pad", bg: "bg-pad/20" },
};

/** 推荐结果展示顺序：冲 → 稳 → 保 → 垫 */
export const TIER_ORDER: Tier[] = ["rush", "stable", "safe", "pad"];

/**
 * 省份 id → 拼音（full 全拼 / abbr 首字母缩写），供 ProvinceCombobox 搜索。
 * abbr 个别重复（如 hb=河北/湖北、sx=山西/陕西、hn=河南/湖南）属客观歧义，全拼可区分。
 */
export const PROVINCE_PINYIN: Record<number, { full: string; abbr: string }> = {
  11: { full: "beijing", abbr: "bj" },
  12: { full: "tianjin", abbr: "tj" },
  13: { full: "hebei", abbr: "hb" },
  14: { full: "shanxi", abbr: "sx" },
  15: { full: "neimenggu", abbr: "nmg" },
  21: { full: "liaoning", abbr: "ln" },
  22: { full: "jilin", abbr: "jl" },
  23: { full: "heilongjiang", abbr: "hlj" },
  31: { full: "shanghai", abbr: "sh" },
  32: { full: "jiangsu", abbr: "js" },
  33: { full: "zhejiang", abbr: "zj" },
  34: { full: "anhui", abbr: "ah" },
  35: { full: "fujian", abbr: "fj" },
  36: { full: "jiangxi", abbr: "jx" },
  37: { full: "shandong", abbr: "sd" },
  41: { full: "henan", abbr: "hn" },
  42: { full: "hubei", abbr: "hb" },
  43: { full: "hunan", abbr: "hn" },
  44: { full: "guangdong", abbr: "gd" },
  45: { full: "guangxi", abbr: "gx" },
  46: { full: "hainan", abbr: "hi" },
  50: { full: "chongqing", abbr: "cq" },
  51: { full: "sichuan", abbr: "sc" },
  52: { full: "guizhou", abbr: "gz" },
  53: { full: "yunnan", abbr: "yn" },
  54: { full: "xizang", abbr: "xz" },
  61: { full: "shaanxi", abbr: "sx" },
  62: { full: "gansu", abbr: "gs" },
  63: { full: "qinghai", abbr: "qh" },
  64: { full: "ningxia", abbr: "nx" },
  65: { full: "xinjiang", abbr: "xj" },
};
