"use client";

import { useEffect, useRef } from "react";
import type { ECharts, EChartsOption } from "echarts";
import { cn } from "@/lib/utils";

/**
 * Apache ECharts 的 Client Component 封装。
 * 动态 import echarts 避免 SSR 报错；option 变化时增量更新而非重建。
 */
export default function EChart({
  option,
  className,
}: {
  option: EChartsOption;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  // 初始化一次
  useEffect(() => {
    let disposed = false;
    void import("echarts").then((echarts) => {
      if (disposed || !containerRef.current) return;
      chartRef.current = echarts.init(containerRef.current);
      chartRef.current.setOption(option);
    });
    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // option 变化时更新
  useEffect(() => {
    chartRef.current?.setOption(option);
  }, [option]);

  return <div ref={containerRef} className={cn("h-64 w-full", className)} />;
}
