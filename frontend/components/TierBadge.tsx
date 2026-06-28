import { TIER_META, type Tier } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 冲/稳/保/垫 档位徽章（Server Component，纯展示） */
export default function TierBadge({
  tier,
  className,
}: {
  tier: Tier;
  className?: string;
}) {
  const meta = TIER_META[tier];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold",
        meta.bg,
        meta.text,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
