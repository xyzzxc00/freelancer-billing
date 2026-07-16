"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "public-page-nudge-dismissed";

// Dashboard 上的接案頁推廣小卡，關閉狀態記在 localStorage（跟 Sidebar 的主題/收合設定同樣做法），
// 使用者設定接案頁網址後這張卡的顯示條件本身就不成立了（見 page.tsx 的 PublicPageBanner）。
export function PublicPageNudge() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div className="border border-border rounded-lg p-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-medium mb-0.5">開通接案頁，讓更多人主動找上你</p>
        <p className="text-xs text-foreground-muted">
          設定一個公開網址，展示服務內容並直接收詢價，不用自己推銷。
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/settings" className="text-sm text-accent hover:underline">
          前往設定 →
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          aria-label="關閉提示"
          className="text-foreground-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
