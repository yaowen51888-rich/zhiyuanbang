import { describe, it, expect } from "vitest";
import { appendUnique } from "../wishlist";

describe("志愿表去重 appendUnique", () => {
  const a = { school_id: 1, name: "电子科技大学" };

  it("空表追加新条目", () => {
    expect(appendUnique([], a)).toEqual([a]);
  });

  it("同 school_id 不重复追加", () => {
    expect(appendUnique([a], a)).toEqual([a]);
  });

  it("不同 school_id 正常追加", () => {
    const b = { school_id: 2, name: "四川大学" };
    expect(appendUnique([a], b)).toEqual([a, b]);
  });
});
