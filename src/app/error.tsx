"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
      <h1 className="text-xl font-medium mb-2">發生了一點問題</h1>
      <p className="text-sm text-foreground-muted max-w-sm leading-relaxed mb-8">
        系統暫時無法處理你的要求。請稍後再試一次，如果問題持續發生，請與我們聯絡。
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-accent text-accent-foreground rounded-md px-6 py-2.5 text-sm font-medium"
        >
          重新嘗試
        </button>
        <a
          href="/"
          className="border border-border rounded-md px-6 py-2.5 text-sm hover:bg-surface"
        >
          回到首頁
        </a>
      </div>
    </div>
  );
}
