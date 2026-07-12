"use client";

import { useState } from "react";

export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 權限被拒時靜默失敗，使用者仍可自行選取網址複製
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-foreground-muted">覺得有幫助？分享給也在接案的朋友：</span>
      <div className="flex items-center gap-2">
        <a
          href={`https://threads.net/intent/post?text=${encodedText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border rounded-md px-3 py-1.5 hover:bg-surface transition-colors"
        >
          Threads
        </a>
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border rounded-md px-3 py-1.5 hover:bg-surface transition-colors"
        >
          LINE
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="border border-border rounded-md px-3 py-1.5 hover:bg-surface transition-colors cursor-pointer"
        >
          {copied ? "已複製！" : "複製連結"}
        </button>
      </div>
    </div>
  );
}
