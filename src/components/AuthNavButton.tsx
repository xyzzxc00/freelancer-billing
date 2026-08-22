"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 伺服器端讀 session 會把整頁踢出靜態渲染，guides 這些 SEO 主力頁會失去 CDN 快取，
// 所以登入狀態改在瀏覽器端判斷：預設顯示未登入版本（絕大多數訪客來自搜尋、未登入），
// hydration 後偵測到 session 再切換。
function useIsLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled && data.session) setLoggedIn(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return loggedIn;
}

// 公開頁 header 右上角的按鈕：未登入顯示「登入」，已登入顯示「返回總覽」
export function AuthNavButton() {
  const loggedIn = useIsLoggedIn();

  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        className="border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-surface"
      >
        返回總覽
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
    >
      登入
    </Link>
  );
}

// 文章底部的 CTA：未登入導去註冊，已登入回總覽
export function AuthArticleCta() {
  const loggedIn = useIsLoggedIn();

  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        className="inline-block bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium"
      >
        返回總覽
      </Link>
    );
  }
  return (
    <Link
      href="/login?mode=signup"
      className="inline-block bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium"
    >
      免費開始使用接案帳本
    </Link>
  );
}
