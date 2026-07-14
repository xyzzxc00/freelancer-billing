"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);

    if (error) {
      setError("寄送失敗，請稍後再試。");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm mb-4">
        <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground">
          ← 返回登入
        </Link>
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">忘記密碼</h1>
        <p className="text-sm text-foreground-muted mb-6">
          輸入註冊時使用的 email，我們會寄一封重設密碼的信給你。
        </p>

        {sent ? (
          <p className="text-sm text-[color:var(--success-fg)]">
            如果這個 email 有註冊過，重設密碼的信已寄出，請到信箱點擊信中連結。
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            />

            {error && <p className="text-sm text-[color:var(--danger-fg)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "寄送中..." : "寄送重設密碼信"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
