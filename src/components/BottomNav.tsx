"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "總覽",
    icon: (
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/clients",
    label: "客戶",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/quotes",
    label: "報價單",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/receivables",
    label: "待收款",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/income",
    label: "收支",
    icon: (
      <>
        <path d="M12 5v14M7 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 15l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    matchPrefixes: ["/income", "/expenses", "/reports"],
    subLabels: { "/income": "收入", "/expenses": "支出", "/reports": "報表" },
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-background border-t border-border flex items-stretch">
      {navItems.map((item) => {
        const prefixes = ("matchPrefixes" in item ? item.matchPrefixes : undefined) ?? [item.href];
        const isActive = prefixes.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        const subLabels = "subLabels" in item ? item.subLabels as Record<string, string> : undefined;
        const activePrefix = subLabels
          ? prefixes.find((p) => pathname === p || pathname.startsWith(`${p}/`))
          : undefined;
        const label = (activePrefix && subLabels?.[activePrefix]) ?? item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
              isActive ? "text-accent" : "text-foreground-muted"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {item.icon}
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
