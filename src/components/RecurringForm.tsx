"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

interface CategoryOption {
  id: string;
  name: string;
}

export function RecurringForm({
  action,
  categories,
  namePlaceholder,
  dayLabel,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  categories: CategoryOption[];
  namePlaceholder: string;
  dayLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">名稱</label>
        <input
          name="name"
          required
          placeholder={namePlaceholder}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">金額</label>
        <input
          name="amount"
          type="number"
          required
          min="0"
          step="1"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">{dayLabel}</label>
        <input
          name="dayOfMonth"
          type="number"
          required
          min="1"
          max="28"
          defaultValue="1"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
        />
        <p className="text-xs text-foreground-muted mt-1">限 1-28 號，避免遇到月底沒有的日期。</p>
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">分類（選填）</label>
        <select
          name="categoryId"
          defaultValue=""
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        >
          <option value="">不分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <FormError message={state?.error} />

      <SubmitButton>儲存</SubmitButton>
    </form>
  );
}
