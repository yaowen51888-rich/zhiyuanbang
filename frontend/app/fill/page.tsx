"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TierBadge from "@/components/TierBadge";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function FillPage() {
  const mounted = useMounted();

  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const move = useWishlistStore((s) => s.move);
  const clear = useWishlistStore((s) => s.clear);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary">模拟填报</h1>
        {mounted && items.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            清空
          </Button>
        )}
      </div>

      {!mounted ? (
        <p className="mt-10 text-center text-muted-foreground">加载中…</p>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-card p-10 text-center shadow-sm">
          <p className="text-foreground">志愿表为空</p>
          <p className="mt-1 text-sm text-muted-foreground">
            从学校详情或推荐结果加入学校
          </p>
          <Button asChild className="mt-4">
            <Link href="/recommend">去推荐</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((it, idx) => (
            <Card key={it.school_id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-sm font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/schools/${it.school_id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {it.name}
                    </Link>
                    {(it.tier || it.probability != null) && (
                      <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        {it.tier && <TierBadge tier={it.tier} />}
                        {it.probability != null && (
                          <span>概率 {Math.round(it.probability)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => move(it.school_id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === items.length - 1}
                    onClick={() => move(it.school_id, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(it.school_id)}
                  >
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
