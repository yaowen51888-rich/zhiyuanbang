"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWishlistStore, type WishlistItem } from "@/lib/store";

/** 加入志愿表按钮（本次会话内标记已加入，避免 persist hydration mismatch） */
export default function AddToWishlistButton({
  item,
  className,
  variant = "default",
  size = "default",
}: {
  item: WishlistItem;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}) {
  const add = useWishlistStore((s) => s.add);
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      variant={done ? "secondary" : variant}
      size={size}
      disabled={done}
      className={className}
      onClick={() => {
        add(item);
        setDone(true);
      }}
    >
      {done ? "已加入 ✓" : "+ 加入志愿表"}
    </Button>
  );
}
