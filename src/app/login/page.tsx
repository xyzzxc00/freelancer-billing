"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const REMEMBER_KEY = "remembered_email";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth"
      ? "Google 登入失敗，請再試一次。"
      : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRememberMe(true);
    }
  }, []);

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // 成功的話瀏覽器會跳轉到 Google，不需再做事
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("兩次輸入的密碼不一致。");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data.session) {
        setNotice("註冊成功，請到信箱收驗證信並完成驗證後再登入。");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-medium mb-1">接案帳本</h1>
      <p className="text-sm text-foreground-muted mb-6">
        {mode === "signin" ? "登入你的帳號" : "建立新帳號"}
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 border border-border rounded-md py-2 text-sm font-medium hover:bg-surface disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        使用 Google 登入
      </button>

      <div className="flex items-center gap-3 my-4">
        <span className="h-px bg-border flex-1" />
        <span className="text-xs text-foreground-muted">或</span>
        <span className="h-px bg-border flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="密碼（至少 8 個字元）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
        />

        {mode === "signup" && (
          <input
            type="password"
            required
            minLength={8}
            placeholder="確認密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          />
        )}

        {mode === "signin" && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              記住帳號
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              忘記密碼？
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-[color:var(--danger-fg)]">{error}</p>}
        {notice && <p className="text-sm text-[color:var(--success-fg)]">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "處理中..." : mode === "signin" ? "登入" : "註冊"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
          setConfirmPassword("");
        }}
        className="text-sm text-foreground-muted hover:text-foreground mt-4"
      >
        {mode === "signin" ? "還沒有帳號？建立一個" : "已經有帳號了？登入"}
      </button>

      <p className="text-xs text-foreground-muted mt-6">
        建立帳號代表你同意我們的
        <Link href="/privacy?from=login" className="text-accent hover:underline mx-1">
          隱私權政策
        </Link>
        。
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm mb-4">
        <Link href="/" className="text-sm text-foreground-muted hover:text-foreground">
          ← 返回首頁
        </Link>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
