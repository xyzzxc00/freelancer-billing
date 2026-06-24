"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const helpRows = [
  { keys: "g d", desc: "前往總覽" },
  { keys: "g q", desc: "前往報價單" },
  { keys: "g c", desc: "前往客戶" },
  { keys: "g r", desc: "前往待收款" },
  { keys: "g i", desc: "前往收入" },
  { keys: "n", desc: "新增（在目前頁面）" },
  { keys: "/", desc: "聚焦搜尋欄" },
  { keys: "?", desc: "顯示／隱藏此說明" },
];

const newRoutes: Record<string, string> = {
  "/quotes": "/quotes/new",
  "/clients": "/clients/new",
  "/income": "/income/new",
  "/expenses": "/expenses/new",
};

export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const pendingG = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;

      const key = e.key;

      if (key === "Escape") {
        setShowHelp(false);
        pendingG.current = false;
        clearTimeout(timer.current);
        return;
      }

      if (key === "?") {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(timer.current);
        const dest: Record<string, string> = {
          d: "/dashboard",
          q: "/quotes",
          c: "/clients",
          r: "/receivables",
          i: "/income",
        };
        if (dest[key]) router.push(dest[key]);
        return;
      }

      if (key === "g") {
        pendingG.current = true;
        timer.current = setTimeout(() => {
          pendingG.current = false;
        }, 1000);
        return;
      }

      if (key === "n") {
        const base = Object.keys(newRoutes).find((r) => pathname.startsWith(r));
        if (base) {
          e.preventDefault();
          router.push(newRoutes[base]);
        }
        return;
      }

      if (key === "/") {
        const input = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[name="q"]'
        );
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-background border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium mb-4">鍵盤快捷鍵</h2>
        <div className="flex flex-col gap-3">
          {helpRows.map((row) => (
            <div key={row.keys} className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">{row.desc}</span>
              <kbd className="bg-surface border border-border rounded px-2 py-0.5 text-xs font-mono tracking-wide">
                {row.keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground-muted mt-5">按 Esc 或點擊背景關閉</p>
      </div>
    </div>
  );
}
