import { describe, it, expect } from "vitest";
import { TIER_META, TIER_ORDER, type Tier } from "../constants";

describe("档位展示映射 TIER_META", () => {
  it("四个档位 label 正确", () => {
    expect(TIER_META.rush.label).toBe("冲");
    expect(TIER_META.stable.label).toBe("稳");
    expect(TIER_META.safe.label).toBe("保");
    expect(TIER_META.pad.label).toBe("垫");
  });

  it("TIER_ORDER 为冲→稳→保→垫顺序", () => {
    expect(TIER_ORDER).toEqual(["rush", "stable", "safe", "pad"]);
  });

  it("每个档位都有 text/bg Tailwind 类", () => {
    (["rush", "stable", "safe", "pad"] as Tier[]).forEach((t) => {
      expect(TIER_META[t].text).toMatch(/^text-/);
      expect(TIER_META[t].bg).toMatch(/^bg-/);
    });
  });
});
