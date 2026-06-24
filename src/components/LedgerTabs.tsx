"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/income", label: "收入" },
  { href: "/expenses", label: "支出" },
  { href: "/reports", label: "報表" },
];

export function LedgerTabs() {
  const pathname = usePathname();

  return (
    <div className="md:hidden flex gap-1 mb-5 border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-accent text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
