import type { Tier } from "@/lib/constants";

/** 志愿表条目（详情页加入时无档位/概率，推荐页加入时带） */
export interface WishlistItem {
  school_id: number;
  name: string;
  tier?: Tier;
  probability?: number;
}

/** 按 school_id 去重追加（纯函数，便于单测） */
export function appendUnique(
  items: WishlistItem[],
  item: WishlistItem,
): WishlistItem[] {
  return items.some((i) => i.school_id === item.school_id)
    ? items
    : [...items, item];
}
