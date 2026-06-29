"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const navItems = [
  {
    href: "/dashboard",
    label: "總覽",
    icon: (
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/clients",
    label: "客戶",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/quotes",
    label: "報價單",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/receivables",
    label: "待收款",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/income",
    label: "收入",
    icon: (
      <path d="M12 5v14M7 9l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/expenses",
    label: "支出",
    matchPrefixes: ["/expenses"],
    icon: (
      <path d="M12 5v14M7 15l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/reports",
    label: "報表",
    icon: (
      <path d="M5 19V10M11 19V5M17 19v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
  },
];

const bottomItems = [
  {
    href: "/settings",
    label: "帳戶設定",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/feedback",
    label: "意見回饋",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

function NavLink({
  href,
  label,
  icon,
  matchPrefixes,
  onClick,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPrefixes?: string[];
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const prefixes = matchPrefixes ?? [href];
  const isActive = prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-foreground-muted hover:bg-surface hover:text-foreground"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        {icon}
      </svg>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export function Sidebar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "light" || stored === "dark" ? stored : getSystemTheme());
  }, []);

  // close drawer on route change
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navContent = (onClose?: () => void) => (
    <>
      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-xs text-foreground-muted px-3 mb-1 mt-2">主選單</p>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}
        <p className="text-xs text-foreground-muted px-3 mb-1 mt-4">設定</p>
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-medium overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <span className="text-sm truncate text-foreground-muted">{displayName}</span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-foreground rounded-lg transition-colors"
        >
          <span>深色模式</span>
          <span className={`w-8 h-4.5 rounded-full relative transition-colors ${theme === "dark" ? "bg-accent" : "bg-border"}`}>
            <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-background transition-transform ${theme === "dark" ? "translate-x-3.5" : ""}`} />
          </span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-[color:var(--danger-fg)] hover:bg-surface rounded-lg transition-colors"
        >
          登出
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border sticky top-0 h-screen overflow-y-auto px-3 py-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold shrink-0">
            帳
          </div>
          <span className="text-sm font-medium">接案帳本</span>
        </div>
        {navContent()}
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-border sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
            帳
          </div>
          <span className="text-sm font-medium">接案帳本</span>
        </div>
        <button
          type="button"
          aria-label="開啟選單"
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer */}
          <div
            ref={drawerRef}
            className="absolute top-0 right-0 w-64 h-full bg-background border-l border-border flex flex-col px-3 py-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-3 mb-3">
              <span className="text-sm font-medium">接案帳本</span>
              <button
                type="button"
                aria-label="關閉選單"
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {navContent(() => setMobileOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}
