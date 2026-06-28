import Link from "next/link";
import { listMajors } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CATEGORIES = [
  "经济学",
  "法学",
  "教育学",
  "文学",
  "历史学",
  "理学",
  "工学",
  "农学",
  "医学",
  "管理学",
  "艺术学",
];

export default async function MajorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const get = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string) : undefined;

  const page = Math.max(1, Number(get("page") ?? "1"));
  const data = await listMajors({
    keyword: get("keyword"),
    category: get("category"),
    page,
    page_size: 12,
  });
  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (get("keyword")) q.set("keyword", get("keyword")!);
    if (get("category")) q.set("category", get("category")!);
    q.set("page", String(p));
    return `/majors?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-extrabold text-primary">专业查询</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-card p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          关键词
          <Input
            type="text"
            name="keyword"
            defaultValue={get("keyword") ?? ""}
            placeholder="专业名"
            className="w-48"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          学科门类
          <select
            name="category"
            defaultValue={get("category") ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">全部</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">筛选</Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">共 {data.total} 个专业</p>

      {data.items.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">没有匹配的专业</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((m) => (
            <Link key={m.major_id} href={`/majors/${m.major_id}`} className="group">
              <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-primary">
                    {m.name}
                  </CardTitle>
                  <CardDescription>
                    {[m.category, m.subcategory, m.specific]
                      .filter(Boolean)
                      .join(" · ")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>上一页</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>下一页</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
