"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 登入後 app 頁面右下角的意見回饋浮動按鈕。
// 只掛在 (app) layout 底下，所以公開頁（報價分享頁、guides、首頁）不會出現。
export function FeedbackFab() {
  const pathname = usePathname();
  // 已經在回饋頁就不需要再顯示入口
  if (pathname.startsWith("/feedback")) return null;

  return (
    <Link
      href="/feedback"
      aria-label="意見回饋"
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex items-center gap-2 rounded-full bg-accent text-accent-foreground shadow-lg px-3 py-3 sm:px-4 sm:py-2.5 text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* 手機只顯示圖示，避免擋到列表操作 */}
      <span className="hidden sm:inline">意見回饋</span>
    </Link>
  );
}
