"use client";

import { useActionState, useMemo, useState } from "react";
import { calculateTax, taxModeLabel, type TaxMode } from "@/lib/tax";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

interface ClientOption {
  id: string;
  name: string;
}

interface ItemRow {
  name: string;
  unitPrice: string;
  quantity: string;
}

interface TemplateOption {
  id: string;
  name: string;
  items: ItemRow[];
}

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function TemplatePicker({
  templates,
  selectedId,
  onSelect,
}: {
  templates: TemplateOption[];
  selectedId: string;
  onSelect: (t: TemplateOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        {selected ? `範本：${selected.name}` : "套用範本"}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {templates.map((t) => {
            const total = t.items.reduce(
              (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
              0
            );
            const isSelected = t.id === selectedId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t);
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border hover:border-accent/50 hover:bg-surface"
                }`}
              >
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-sm font-mono text-foreground-muted">
                  {currency.format(total)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function QuoteForm({
  clients,
  action,
  defaultClientId,
  defaultTitle = "",
  defaultTaxMode = "NONE",
  defaultItems = [{ name: "", unitPrice: "", quantity: "1" }],
  defaultNotes = "",
  showClientField = true,
  templates = [],
}: {
  clients: ClientOption[];
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultClientId?: string;
  defaultTitle?: string;
  defaultTaxMode?: TaxMode;
  defaultItems?: ItemRow[];
  defaultNotes?: string;
  showClientField?: boolean;
  templates?: TemplateOption[];
}) {
  const [items, setItems] = useState<ItemRow[]>(defaultItems);
  const [taxMode, setTaxMode] = useState<TaxMode>(defaultTaxMode);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [state, formAction] = useActionState(action, undefined);

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
    <form action={formAction} className="flex flex-col gap-4">
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

      {templates.length > 0 && (
        <TemplatePicker
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={(t) => {
            setItems(t.items);
            setSelectedTemplateId(t.id);
          }}
        />
      )}

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
                  min="1"
                  placeholder="單價"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1 min-w-0 sm:w-24 sm:flex-none font-mono"
                />
                <input
                  type="number"
                  min="1"
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

      <div>
        <label className="text-sm text-foreground-muted block mb-1">備註</label>
        <textarea
          name="notes"
          defaultValue={defaultNotes}
          placeholder="付款方式、有效期限、其他說明…（選填）"
          rows={3}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
        />
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
        {breakdown.clientLines.map((line) => (
          <div key={line.label} className="flex justify-between text-foreground-muted">
            <span>{line.label}</span>
            <span className="font-mono">{currency.format(line.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
          <span>客戶看到金額</span>
          <span className="font-mono">{currency.format(breakdown.clientTotal)}</span>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm">
        {breakdown.freelancerLines.map((line) => (
          <div key={line.label} className="flex justify-between text-foreground-muted">
            <span>{line.label}</span>
            <span className="font-mono">{currency.format(line.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
          <span>自己實拿金額</span>
          <span className="font-mono">{currency.format(breakdown.freelancerNet)}</span>
        </div>
      </div>

      <FormError message={state?.error} />

      <SubmitButton className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium">
        儲存
      </SubmitButton>
    </form>
  );
}
