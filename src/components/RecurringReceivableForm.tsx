"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

interface ClientOption {
  id: string;
  name: string;
}

export function RecurringReceivableForm({
  action,
  clients,
  defaultTitle = "",
  defaultAmount = "",
  defaultClientId = "",
  defaultDayOfMonth = 1,
  defaultDueInDays = 14,
  submitLabel = "儲存",
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  clients: ClientOption[];
  defaultTitle?: string;
  defaultAmount?: string;
  defaultClientId?: string;
  defaultDayOfMonth?: number;
  defaultDueInDays?: number;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">請款名稱</label>
        <input
          name="title"
          required
          defaultValue={defaultTitle}
          placeholder="例如：網站維護月費"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>
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
        <label className="text-sm text-foreground-muted block mb-1">每月請款日</label>
        <input
          name="dayOfMonth"
          type="number"
          required
          min="1"
          max="28"
          defaultValue={defaultDayOfMonth}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
        />
        <p className="text-xs text-foreground-muted mt-1">限 1-28 號，避免遇到月底沒有的日期。</p>
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">付款期限（天）</label>
        <input
          name="dueInDays"
          type="number"
          required
          min="0"
          max="60"
          defaultValue={defaultDueInDays}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
        />
        <p className="text-xs text-foreground-muted mt-1">
          產生應收款後幾天內要收到款，超過會出現在逾期提醒裡。
        </p>
      </div>

      <FormError message={state?.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
