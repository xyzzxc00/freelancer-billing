"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionResult } from "@/lib/action-state";

interface Props {
  categoryId: string;
  currentName: string;
  renameAction: (id: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}

const initialState: ActionResult = {};

export function InlineCategoryEdit({ categoryId, currentName, renameAction }: Props) {
  const [editing, setEditing] = useState(false);
  const boundAction = renameAction.bind(null, categoryId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-left hover:text-accent"
      >
        {currentName}
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2 flex-wrap">
      <input
        name="name"
        defaultValue={currentName}
        autoFocus
        required
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        className="border border-border rounded px-2 py-0.5 text-sm bg-background"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-accent disabled:opacity-50"
      >
        {pending ? "…" : "儲存"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-foreground-muted"
      >
        取消
      </button>
      {state?.error && (
        <span className="text-xs text-[color:var(--danger-fg)]">{state.error}</span>
      )}
    </form>
  );
}
