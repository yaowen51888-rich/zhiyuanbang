"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const nav = [
  { label: "学校", href: "/schools" },
  { label: "专业", href: "/majors" },
  { label: "推荐", href: "/recommend" },
  { label: "填报", href: "/fill" },
];

export default function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#E3EDE7]">
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1F2A2E]/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between">
            <span className="text-[#16332C] font-semibold">菜单</span>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E3EDE7]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <nav className="mt-8 flex flex-col gap-2">
            {nav.map((n) => (
              <Dialog.Close asChild key={n.label}>
                <Link
                  href={n.href}
                  className="px-4 py-3 rounded-xl text-[#46615C] hover:bg-[#F2F8F5] hover:text-[#2A9D8F] transition-colors"
                >
                  {n.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <button className="h-10 w-full rounded-full border border-[#E3EDE7] text-[#46615C]">
              登录
            </button>
            <Link
              href="/recommend"
              className="h-10 w-full rounded-full bg-[#2A9D8F] text-white inline-flex items-center justify-center hover:bg-[#23867A]"
            >
              免费开始
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
