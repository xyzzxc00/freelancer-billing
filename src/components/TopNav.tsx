"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "總覽" },
  { href: "/clients", label: "客戶" },
  { href: "/quotes", label: "報價單" },
  { href: "/receivables", label: "待收款" },
  { href: "/transactions", label: "收支" },
  { href: "/expenses", label: "支出" },
];

export function TopNav({ displayName }: { displayName: string }) {
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
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <LogoutButton className="hidden sm:inline text-sm text-foreground-muted hover:text-foreground" />
        <Link
          href="/settings"
          aria-label="帳戶設定"
          className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm font-medium hover:bg-[color:var(--border)] transition-colors"
        >
          {displayName.slice(0, 1).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
