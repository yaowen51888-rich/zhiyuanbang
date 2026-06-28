import Link from "next/link";
import type { RecommendItemOut } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import TierBadge from "@/components/TierBadge";
import AddToWishlistButton from "@/components/AddToWishlistButton";

export default function RecommendItemCard({ item }: { item: RecommendItemOut }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Link
            href={`/schools/${item.school_id}`}
            className="font-bold text-brand-dark hover:underline"
          >
            {item.school_name}
          </Link>
          <p className="text-sm text-ink-muted">
            位次 {item.rank_min.toLocaleString()}–{item.rank_max.toLocaleString()}
            （均值 {Math.round(item.rank_mean).toLocaleString()}）
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <TierBadge tier={item.tier as "rush" | "stable" | "safe" | "pad"} />
          <span className="text-lg font-extrabold text-brand-dark">
            {Math.round(item.probability)}%
          </span>
          <AddToWishlistButton
            item={{
              school_id: item.school_id,
              name: item.school_name,
              tier: item.tier as "rush" | "stable" | "safe" | "pad",
              probability: item.probability,
            }}
            variant="outline"
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
