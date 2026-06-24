"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AccountMenu({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(stored === "light" || stored === "dark" ? stored : getSystemTheme());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="帳戶選單"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm font-medium hover:bg-[color:var(--border)] transition-colors overflow-hidden"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          displayName.slice(0, 1).toUpperCase()
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-lg py-1.5 z-20">
          <p className="px-3 py-2 text-sm font-medium truncate border-b border-border mb-1">
            {displayName}
          </p>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-surface"
          >
            帳戶設定
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface text-left"
          >
            <span>深色模式</span>
            <span
              className={`w-9 h-5 rounded-full relative transition-colors ${
                theme === "dark" ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                  theme === "dark" ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>

          <a
            href="mailto:xyzzxc00@gmail.com?subject=接案帳本%20意見回饋"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-surface"
          >
            意見回饋
          </a>

          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-[color:var(--danger-fg)] hover:bg-surface"
            >
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
