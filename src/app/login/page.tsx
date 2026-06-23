"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
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
