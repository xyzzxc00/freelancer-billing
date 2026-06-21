"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "總覽" },
  { href: "/clients", label: "客戶" },
  { href: "/quotes", label: "報價單" },
  { href: "/receivables", label: "待收款" },
  { href: "/transactions", label: "收支" },
];

export function TopNav({ active }: { active: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-6">
        <span className="text-base font-medium">接案帳本</span>
        <nav className="flex gap-5 text-sm text-foreground-muted">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.label === active
                  ? "text-foreground font-medium border-b-2 border-accent pb-0.5"
                  : "hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          登出
        </button>
        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm font-medium">
          阿
        </div>
      </div>
    </header>
  );
}
