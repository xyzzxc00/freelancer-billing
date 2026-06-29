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
    icon: (<path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />),
  },
  {
    href: "/clients",
    label: "客戶",
    icon: (<><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>),
  },
  {
    href: "/quotes",
    label: "報價單",
    icon: (<><rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>),
  },
  {
    href: "/receivables",
    label: "待收款",
    icon: (<><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>),
  },
  {
    href: "/income",
    label: "收入",
    icon: (<path d="M12 5v14M7 9l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />),
  },
  {
    href: "/expenses",
    label: "支出",
    icon: (<path d="M12 5v14M7 15l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />),
  },
  {
    href: "/reports",
    label: "報表",
    icon: (<path d="M5 19V10M11 19V5M17 19v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />),
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-foreground-muted hover:bg-surface hover:text-foreground"
      }`}
    >
      <Icon>{icon}</Icon>
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
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "light" || stored === "dark" ? stored : getSystemTheme());
    const c = localStorage.getItem("sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c === "1") setCollapsed(true);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  }

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

  const avatar = (size: "sm" | "md") => {
    const cls = size === "sm"
      ? "w-6 h-6 text-xs"
      : "w-7 h-7 text-xs";
    return (
      <div className={`${cls} rounded-full bg-surface border border-border flex items-center justify-center font-medium overflow-hidden shrink-0`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          displayName.slice(0, 1).toUpperCase()
        )}
      </div>
    );
  };

  const userMenuJsx = (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-lg py-1.5 z-30 shadow-lg">
      <p className="px-3 py-2 text-sm font-medium truncate border-b border-border mb-1">
        {displayName}
      </p>
      <Link
        href="/settings"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface transition-colors"
      >
        <Icon>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </Icon>
        帳戶設定
      </Link>
      <Link
        href="/feedback"
        onClick={() => setUserMenuOpen(false)}
        className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface transition-colors"
      >
        <Icon>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Icon>
        意見回饋
      </Link>
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </Icon>
          深色模式
        </div>
        <span className={`w-8 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-accent" : "bg-border"}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${theme === "dark" ? "translate-x-3" : ""}`} />
        </span>
      </button>
      <div className="border-t border-border mt-1 pt-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-[color:var(--danger-fg)] hover:bg-surface transition-colors"
        >
          <Icon>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </Icon>
          登出
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-border sticky top-0 h-screen overflow-y-auto py-4 transition-all duration-200 ${
          collapsed ? "w-14 px-2" : "w-52 px-3"
        }`}
      >
        {/* Top: brand + collapse toggle */}
        <div className={`flex items-center mb-3 ${collapsed ? "justify-center" : "justify-between px-1"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">帳</div>
              <span className="text-sm font-medium">接案帳本</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "展開側欄" : "收合側欄"}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {!collapsed && <p className="text-xs text-foreground-muted px-3 mb-1">主選單</p>}
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* User button */}
        <div className="mt-3 pt-3 border-t border-border relative" ref={userMenuRef}>
          {userMenuOpen && userMenuJsx}
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className={`w-full flex items-center rounded-lg hover:bg-surface transition-colors text-sm text-foreground-muted ${
              collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2"
            }`}
          >
            {avatar("sm")}
            {!collapsed && <span className="truncate">{displayName}</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-border sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">帳</div>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 w-64 h-full bg-background border-l border-border flex flex-col px-3 py-4 overflow-y-auto">
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

            <nav className="flex flex-col gap-0.5 flex-1">
              <p className="text-xs text-foreground-muted px-3 mb-1 mt-2">主選單</p>
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            {/* Mobile user section */}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                {avatar("md")}
                <span className="text-sm truncate text-foreground-muted">{displayName}</span>
              </div>
              <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground-muted hover:bg-surface rounded-lg transition-colors">
                帳戶設定
              </Link>
              <Link href="/feedback" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground-muted hover:bg-surface rounded-lg transition-colors">
                意見回饋
              </Link>
              <button type="button" onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground-muted hover:bg-surface rounded-lg transition-colors">
                <span>深色模式</span>
                <span className={`w-8 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-accent" : "bg-border"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${theme === "dark" ? "translate-x-3" : ""}`} />
                </span>
              </button>
              <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-[color:var(--danger-fg)] hover:bg-surface rounded-lg transition-colors">
                登出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
