"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "總覽",
  "/inquiries": "詢價",
  "/clients": "客戶",
  "/quotes": "報價單",
  "/receivables": "待收款",
  "/income": "收入",
  "/expenses": "支出",
  "/reports": "報表",
  "/settings": "帳戶設定",
  "/feedback": "意見回饋",
};

export function ContentHeader() {
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(`${key}/`)
  )?.[1];

  if (!title) return null;

  return (
    <header className="hidden md:flex items-center h-12 px-6 border-b border-border bg-background sticky top-0 z-10 shrink-0">
      <h1 className="text-sm font-medium">{title}</h1>
    </header>
  );
}
