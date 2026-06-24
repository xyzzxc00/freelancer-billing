"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/AccountMenu";

const navItems = [
  { href: "/dashboard", label: "總覽" },
  { href: "/clients", label: "客戶" },
  { href: "/quotes", label: "報價單" },
  { href: "/receivables", label: "待收款" },
  { href: "/income", label: "收入" },
  { href: "/expenses", label: "支出" },
  { href: "/reports", label: "報表" },
];

export function TopNav({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
      <div className="flex items-center gap-6">
        <span className="text-base font-medium">接案帳本</span>
        <nav className="hidden md:flex gap-5 text-sm text-foreground-muted">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "text-foreground font-medium border-b-2 border-accent pb-0.5"
                    : "hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <AccountMenu displayName={displayName} avatarUrl={avatarUrl} />
    </header>
  );
}
