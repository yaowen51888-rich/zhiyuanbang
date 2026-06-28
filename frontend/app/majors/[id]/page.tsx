import { notFound } from "next/navigation";
import Link from "next/link";
import type { EChartsOption } from "echarts";
import { listMajors, majorScores } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EChart from "@/components/EChart";

export default async function MajorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const majorId = Number(id);

  // ponytail: 后端无 /majors/{id} 单体端点，阶段 1 专业少，用列表单页 find 取信息；
  // 数据量增大后应在后端补 GET /majors/{id}。
  const list = await listMajors({ page_size: 100 });
  const major = list.items.find((m) => m.major_id === majorId);
  if (!major) notFound();

  const scores = (await majorScores(majorId)).sort((a, b) => a.year - b.year);

  const chartOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["专业最低分", "最低位次"], top: 0 },
    grid: { left: 8, right: 8, bottom: 8, top: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: scores.map((s) => String(s.year)),
    },
    yAxis: [
      { type: "value", name: "分数", scale: true },
      { type: "value", name: "位次", scale: true },
    ],
    series: [
      {
        name: "专业最低分",
        type: "line",
        smooth: true,
        data: scores.map((s) => s.score),
        itemStyle: { color: "#4fb3a9" },
        lineStyle: { color: "#4fb3a9" },
      },
      {
        name: "最低位次",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: scores.map((s) => s.rank),
        itemStyle: { color: "#f6a56c" },
        lineStyle: { color: "#f6a56c" },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/majors">← 返回专业列表</Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-primary">{major.name}</h1>
        {major.category && (
          <Badge className="bg-primary/15 text-primary">{major.category}</Badge>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">专业信息</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-muted-foreground">学科门类</dt>
                <dd className="text-foreground">{major.category || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-muted-foreground">专业类</dt>
                <dd className="text-foreground">{major.subcategory || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-muted-foreground">具体专业</dt>
                <dd className="text-foreground">{major.specific || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">历年专业分数</CardTitle>
          </CardHeader>
          <CardContent>
            {scores.length > 0 ? (
              <EChart option={chartOption} className="h-72" />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                暂无历年专业分数数据
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
