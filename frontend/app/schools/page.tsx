import Link from "next/link";
import { listSchools } from "@/lib/api";
import { ProvinceCombobox } from "@/components/province-combobox";
import SchoolCard from "@/components/SchoolCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SCHOOL_TYPES = [
  "综合",
  "理工",
  "师范",
  "财经",
  "农林",
  "医药",
  "民族",
  "艺术",
  "政法",
  "语言",
];

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const get = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string) : undefined;

  const page = Math.max(1, Number(get("page") ?? "1"));
  const province = get("province") || "江苏";
  const data = await listSchools({
    keyword: get("keyword"),
    province,
    is_985: get("is_985") === "1" ? true : undefined,
    is_211: get("is_211") === "1" ? true : undefined,
    type: get("type"),
    page,
    page_size: 12,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  // 保留筛选条件，附加分页参数
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    q.set("province", province);
    if (get("keyword")) q.set("keyword", get("keyword")!);
    if (get("is_985") === "1") q.set("is_985", "1");
    if (get("is_211") === "1") q.set("is_211", "1");
    if (get("type")) q.set("type", get("type")!);
    q.set("page", String(p));
    return `/schools?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-extrabold text-primary">学校查询 · {province}</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          省份
          <ProvinceCombobox
            name="province"
            defaultValue={province}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          关键词
          <Input
            type="text"
            name="keyword"
            defaultValue={get("keyword") ?? ""}
            placeholder="校名"
            className="w-40"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          类型
          <select
            name="type"
            defaultValue={get("type") ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">全部</option>
            {SCHOOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="is_985"
            value="1"
            defaultChecked={get("is_985") === "1"}
            className="accent-primary h-4 w-4"
          />
          985
        </label>
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="is_211"
            value="1"
            defaultChecked={get("is_211") === "1"}
            className="accent-primary h-4 w-4"
          />
          211
        </label>
        <Button type="submit">筛选</Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">共 {data.total} 所</p>

      {data.items.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">没有匹配的学校</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s) => (
            <SchoolCard key={s.school_id} school={s} />
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
