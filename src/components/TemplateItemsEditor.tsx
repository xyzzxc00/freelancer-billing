"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

interface ItemRow {
  name: string;
  unitPrice: string;
  quantity: string;
}

export function TemplateItemsEditor({
  action,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [items, setItems] = useState<ItemRow[]>([{ name: "", unitPrice: "", quantity: "1" }]);
  const [state, formAction] = useActionState(action, undefined);

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", unitPrice: "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div>
        <label className="text-sm text-foreground-muted block mb-1">範本名稱</label>
        <input
          name="name"
          required
          placeholder="例如：標準網站設計報價"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>

      <div>
        <label className="text-sm text-foreground-muted block mb-2">項目</label>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 sm:items-center border border-border sm:border-none rounded-md p-2 sm:p-0"
            >
              <input
                placeholder="項目名稱"
                value={item.name}
                onChange={(e) => updateItem(i, "name", e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1 min-w-0"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="單價"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1 min-w-0 sm:w-24 sm:flex-none font-mono"
                />
                <input
                  type="number"
                  placeholder="數量"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1 min-w-0 sm:w-20 sm:flex-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label="移除項目"
                  className="text-foreground-muted hover:text-[color:var(--danger-fg)] px-1 shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-sm text-accent hover:underline mt-2"
        >
          + 新增項目
        </button>
      </div>

      <FormError message={state?.error} />

      <SubmitButton className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium">
        儲存範本
      </SubmitButton>
    </form>
  );
}
