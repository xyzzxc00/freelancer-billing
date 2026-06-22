"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordChangeForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        required
        minLength={6}
        placeholder="新密碼（至少 6 個字元）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-border rounded-md px-3 py-2 text-sm bg-background"
      />
      {error && <p className="text-sm text-[color:var(--danger-fg)]">{error}</p>}
      {success && <p className="text-sm text-[color:var(--success-fg)]">密碼已更新</p>}
      <button
        type="submit"
        disabled={loading}
        className="border border-border rounded-md py-2 text-sm font-medium hover:bg-surface disabled:opacity-60 self-start px-4"
      >
        {loading ? "更新中..." : "更新密碼"}
      </button>
    </form>
  );
}
