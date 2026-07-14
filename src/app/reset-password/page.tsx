"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = 還在確認 session
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致。");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(
        error.message.includes("different from the old password")
          ? "新密碼不能跟舊密碼相同。"
          : "重設失敗，連結可能已過期，請重新申請重設密碼信。"
      );
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-1">重設密碼</h1>
        <p className="text-sm text-foreground-muted mb-6">請設定新的登入密碼。</p>

        {hasSession === false ? (
          <p className="text-sm text-[color:var(--danger-fg)]">
            這個重設連結已失效或過期，請
            <Link href="/forgot-password" className="text-accent hover:underline mx-1">
              重新申請
            </Link>
            一封重設密碼信。
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              required
              minLength={8}
              placeholder="新密碼（至少 8 個字元）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="確認新密碼"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            />

            {error && <p className="text-sm text-[color:var(--danger-fg)]">{error}</p>}

            <button
              type="submit"
              disabled={loading || hasSession === null}
              className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "處理中..." : "更新密碼"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
