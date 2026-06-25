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
    if (state?.success) setEditing(false);
  }, [state]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 group">
        <span className="text-sm font-medium">{currentName}</span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-muted hover:text-foreground"
          title="重新命名"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        ref={inputRef}
        name="name"
        defaultValue={currentName}
        autoFocus
        required
        disabled={pending}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        className="border border-border rounded px-2 py-0.5 text-sm bg-background w-36 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-accent disabled:opacity-50 shrink-0"
      >
        {pending ? "…" : "儲存"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={pending}
        className="text-xs text-foreground-muted shrink-0"
      >
        取消
      </button>
      {state?.error && (
        <span className="text-xs text-[color:var(--danger-fg)]">{state.error}</span>
      )}
    </form>
  );
}
