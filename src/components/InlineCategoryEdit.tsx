"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/action-state";

interface Props {
  categoryId: string;
  currentName: string;
  renameAction: (id: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}

const initialState: ActionResult = {};

export function InlineCategoryEdit({ categoryId, currentName, renameAction }: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boundAction = renameAction.bind(null, categoryId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state?.success) setEditing(false);
  }, [state]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-foreground-muted hover:text-foreground"
      >
        編輯
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
      <input
        ref={inputRef}
        name="name"
        defaultValue={currentName}
        autoFocus
        required
        disabled={pending}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        className="border border-border rounded px-2 py-1 text-sm bg-background flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button type="submit" disabled={pending} className="text-xs text-accent disabled:opacity-50 shrink-0">
        {pending ? "…" : "儲存"}
      </button>
      <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-xs text-foreground-muted shrink-0">
        取消
      </button>
      {state?.error && <span className="text-xs text-[color:var(--danger-fg)]">{state.error}</span>}
    </form>
  );
}
