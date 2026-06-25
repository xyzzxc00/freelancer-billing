"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { MergeCategoryForm } from "@/components/MergeCategoryForm";
import type { ActionResult } from "@/lib/action-state";

interface Category {
  id: string;
  name: string;
  _count: { transactions: number };
}

interface Props {
  category: Category;
  others: Category[];
  renameAction: (id: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  deleteAction: () => Promise<void>;
  mergeAction: (fromId: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  deleteConfirmMessage: string;
}

const initialState: ActionResult = {};

export function CategoryCard({
  category,
  others,
  renameAction,
  deleteAction,
  mergeAction,
  deleteConfirmMessage,
}: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boundRename = renameAction.bind(null, category.id);
  const [state, action, pending] = useActionState(boundRename, initialState);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  return (
    <div className="border border-border rounded-lg px-4 py-3">
      {editing ? (
        <form action={action} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            name="name"
            defaultValue={category.name}
            autoFocus
            required
            disabled={pending}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {state?.error && (
            <p className="text-xs text-[color:var(--danger-fg)]">{state.error}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="text-xs text-accent disabled:opacity-50"
            >
              {pending ? "儲存中…" : "儲存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="text-xs text-foreground-muted"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{category.name}</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                {category._count.transactions} 筆記錄
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-foreground-muted hover:text-foreground"
              >
                編輯
              </button>
              <ConfirmDeleteButton
                action={deleteAction}
                confirmMessage={deleteConfirmMessage}
                successMessage="已刪除分類"
                className="text-xs text-foreground-muted hover:text-[color:var(--danger-fg)]"
              />
            </div>
          </div>
          {category._count.transactions > 0 && others.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <MergeCategoryForm
                categoryId={category.id}
                otherCategories={others}
                mergeAction={mergeAction}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
