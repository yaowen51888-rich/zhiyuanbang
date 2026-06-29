"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appendUnique, type WishlistItem } from "@/lib/wishlist";

export type { WishlistItem };

interface WishlistState {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (school_id: number) => void;
  move: (school_id: number, dir: -1 | 1) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: appendUnique(s.items, item) })),
      remove: (school_id) =>
        set((s) => ({
          items: s.items.filter((i) => i.school_id !== school_id),
        })),
      move: (school_id, dir) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.school_id === school_id);
          const target = idx + dir;
          if (idx < 0 || target < 0 || target >= s.items.length) return s;
          const next = [...s.items];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { items: next };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "gkvr-wishlist" },
  ),
);
