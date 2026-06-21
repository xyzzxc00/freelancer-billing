"use client";

import { useMemo, useState } from "react";
import { calculateTax, taxModeLabel, type TaxMode } from "@/lib/tax";

interface ClientOption {
  id: string;
  name: string;
}

interface ItemRow {
  name: string;
  unitPrice: string;
  quantity: string;
}

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function QuoteForm({
  clients,
  action,
  defaultClientId,
  defaultTitle = "",
  defaultTaxMode = "NONE",
  defaultItems = [{ name: "", unitPrice: "", quantity: "1" }],
  showClientField = true,
}: {
  clients: ClientOption[];
  action: (formData: FormData) => void;
  defaultClientId?: string;
  defaultTitle?: string;
  defaultTaxMode?: TaxMode;
  defaultItems?: ItemRow[];
  showClientField?: boolean;
}) {
  const [items, setItems] = useState<ItemRow[]>(defaultItems);
  const [taxMode, setTaxMode] = useState<TaxMode>(defaultTaxMode);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const breakdown = useMemo(() => calculateTax(subtotal, taxMode), [subtotal, taxMode]);

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
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div>
        <label className="text-sm text-foreground-muted block mb-1">標題</label>
        <input
          name="title"
          required
          defaultValue={defaultTitle}
          placeholder="例如：品牌識別設計"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>

      {showClientField && (
        <div>
          <label className="text-sm text-foreground-muted block mb-1">客戶</label>
          <select
            name="clientId"
            required
            defaultValue={defaultClientId}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
          >
            <option value="" disabled>
              選擇客戶
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-foreground-muted block mb-2">項目</label>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="項目名稱"
                value={item.name}
                onChange={(e) => updateItem(i, "name", e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1"
              />
              <input
                type="number"
                placeholder="單價"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-24 font-mono"
              />
              <input
                type="number"
                placeholder="數量"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-20 font-mono"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label="移除項目"
                className="text-foreground-muted hover:text-[color:var(--danger-fg)] px-1"
              >
                ✕
              </button>
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

      <div>
        <label className="text-sm text-foreground-muted block mb-1">稅務試算</label>
        <select
          name="taxMode"
          value={taxMode}
          onChange={(e) => setTaxMode(e.target.value as TaxMode)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        >
          {Object.entries(taxModeLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm">
        {breakdown.lines.map((line) => (
          <div key={line.label} className="flex justify-between text-foreground-muted">
            <span>{line.label}</span>
            <span className="font-mono">{currency.format(line.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
          <span>客戶看到金額</span>
          <span className="font-mono">{currency.format(breakdown.clientTotal)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>自己實拿金額</span>
          <span className="font-mono">{currency.format(breakdown.freelancerNet)}</span>
        </div>
      </div>

      <button
        type="submit"
        className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium"
      >
        儲存
      </button>
    </form>
  );
}
