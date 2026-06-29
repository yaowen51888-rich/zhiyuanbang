"use client";

import { useMemo, useState } from "react";
import { Popover } from "radix-ui";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVINCES, PROVINCE_PINYIN } from "@/lib/constants";

interface ProvinceComboboxProps {
  /** 受控模式：当前省份 id */
  value?: string;
  /** 受控模式：选中省份 id 回调 */
  onValueChange?: (id: string) => void;
  /** 表单模式：hidden input 的 name，随 GET 表单提交【省名】 */
  name?: string;
  /** 表单模式初值（省名） */
  defaultValue?: string;
  /** trigger 样式透传（默认仅布局，视觉由调用方决定） */
  className?: string;
  placeholder?: string;
}

/**
 * 省份可搜索下拉。
 * - 受控用法（Hero/recommend）：<ProvinceCombobox value={id} onValueChange={fn} />
 * - 表单用法（schools GET 提交）：<ProvinceCombobox name="province" defaultValue="江苏" />
 *   内部 hidden input 提交省名，保持后端 listSchools({ province: 省名 }) 数据流不变。
 */
export function ProvinceCombobox({
  value,
  onValueChange,
  name,
  defaultValue,
  className,
  placeholder = "选择省份",
}: ProvinceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // 表单模式下内部跟踪选中的省名（与 hidden input 对齐）
  const [internalName, setInternalName] = useState<string | undefined>(
    name ? defaultValue : undefined
  );

  // 受控按 id 解析；表单按省名解析。两路都来自 PROVINCES，SSR/CSR 初值一致，无 hydration mismatch。
  const selected = useMemo(() => {
    if (value !== undefined) {
      return PROVINCES.find((p) => String(p.id) === String(value));
    }
    return PROVINCES.find((p) => p.name === (internalName ?? defaultValue));
  }, [value, internalName, defaultValue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROVINCES;
    return PROVINCES.filter((p) => {
      if (query.trim() && p.name.includes(query.trim())) return true;
      const py = PROVINCE_PINYIN[p.id];
      return py ? py.full.startsWith(q) || py.abbr.startsWith(q) : false;
    });
  }, [query]);

  const handleSelect = (id: number) => {
    const p = PROVINCES.find((x) => x.id === id);
    if (!p) return;
    onValueChange?.(String(id));
    if (name) setInternalName(p.name);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={selected?.name ?? ""} />}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className={cn(
            "flex w-full items-center justify-between gap-1 text-sm outline-none",
            className
          )}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-50 rounded-lg border border-[#E3EDE7] bg-popover p-1 text-popover-foreground shadow-md"
            style={{ minWidth: "var(--radix-popover-trigger-width)" }}
          >
            <div className="flex items-center gap-1.5 px-2">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索省份，如 江苏 / js"
                autoFocus
                className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="mt-1 max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  未找到匹配省份
                </div>
              ) : (
                filtered.map((p) => {
                  const active = selected?.id === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground"
                      )}
                    >
                      {p.name}
                      {active && <CheckIcon className="size-4 shrink-0 text-[#2A9D8F]" />}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
