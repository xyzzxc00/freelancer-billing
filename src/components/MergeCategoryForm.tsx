"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/lib/action-state";

interface Props {
  categoryId: string;
  otherCategories: { id: string; name: string }[];
  mergeAction: (fromId: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}

const initialState: ActionResult = {};

export function MergeCategoryForm({ categoryId, otherCategories, mergeAction }: Props) {
  const [open, setOpen] = useState(false);
  const boundAction = mergeAction.bind(null, categoryId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-foreground-muted hover:text-foreground"
      >
        合併至…
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <select
        name="toId"
        defaultValue=""
        required
        className="text-xs border border-border rounded px-2 py-1 bg-background"
      >
        <option value="" disabled>選擇目標分類</option>
        {otherCategories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-xs px-2 py-1 bg-warning-bg text-warning-fg rounded hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "合併中…" : "合併並刪除"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-foreground-muted hover:text-foreground"
      >
        取消
      </button>
      {state?.error && <span className="text-xs text-[color:var(--danger-fg)]">{state.error}</span>}
    </form>
  );
}
