"use client";

import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";

interface CategoryOption {
  id: string;
  name: string;
}

// 快速記帳的表單彈窗，本身不管開關狀態、觸發按鈕放在哪——由 Sidebar 決定要在桌面側欄
// 或手機頂部列放入口，避免用一個永遠浮在畫面上的按鈕擋住內容。
export function QuickAddModal({
  open,
  onClose,
  type,
  onTypeChange,
  incomeCategories,
  expenseCategories,
  formAction,
  error,
}: {
  open: boolean;
  onClose: () => void;
  type: "expense" | "income";
  onTypeChange: (type: "expense" | "income") => void;
  incomeCategories: CategoryOption[];
  expenseCategories: CategoryOption[];
  formAction: (formData: FormData) => void;
  error?: string;
}) {
  if (!open) return null;

  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-t-xl sm:rounded-xl w-full sm:max-w-sm p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">快速記一筆</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="text-foreground-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => onTypeChange("expense")}
            className={`flex-1 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              type === "expense"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("income")}
            className={`flex-1 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              type === "income"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            收入
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="type" value={type} />

          <div>
            <label className="text-sm text-foreground-muted block mb-1">金額</label>
            <input
              name="amount"
              type="number"
              required
              min="0"
              step="1"
              autoFocus
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-foreground-muted block mb-1">分類</label>
            <select
              name="categoryId"
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

          <div>
            <label className="text-sm text-foreground-muted block mb-1">日期</label>
            <input
              name="occurredAt"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full appearance-none"
            />
          </div>

          <div>
            <label className="text-sm text-foreground-muted block mb-1">備註</label>
            <input
              name="note"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
          </div>

          <FormError message={error} />
          <SubmitButton>儲存</SubmitButton>
        </form>
      </div>
    </div>
  );
}
