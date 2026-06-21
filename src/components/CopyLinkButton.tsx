"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1 font-mono"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="border border-border rounded-md px-3 py-2 text-sm hover:bg-surface"
      >
        {copied ? "已複製" : "複製連結"}
      </button>
    </div>
  );
}
