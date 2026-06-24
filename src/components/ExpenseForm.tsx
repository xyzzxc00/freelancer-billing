"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

interface CategoryOption {
  id: string;
  name: string;
}

export function ExpenseForm({
  action,
  categories,
  categoriesHref,
  defaultAmount,
  defaultCategoryId,
  defaultOccurredAt,
  defaultNote,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  categories: CategoryOption[];
  categoriesHref: string;
  defaultAmount?: string;
  defaultCategoryId?: string;
  defaultOccurredAt?: string;
  defaultNote?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">金額</label>
        <input
          name="amount"
          type="number"
          required
          min="0"
          step="1"
          defaultValue={defaultAmount}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">分類</label>
        <select
          name="categoryId"
          defaultValue={defaultCategoryId ?? ""}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        >
          <option value="">不分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="text-xs text-foreground-muted mt-1">
            還沒有分類，去
            <Link href={categoriesHref} className="text-accent hover:underline mx-1">
              新增分類
            </Link>
            方便之後統計。
          </p>
        )}
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">日期</label>
        <input
          name="occurredAt"
          type="date"
          required
          defaultValue={defaultOccurredAt ?? new Date().toISOString().slice(0, 10)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">備註</label>
        <input
          name="note"
          defaultValue={defaultNote}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>

      <FormError message={state?.error} />

      <SubmitButton>儲存</SubmitButton>
    </form>
  );
}
