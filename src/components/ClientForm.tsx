"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

export function ClientForm({
  action,
  defaultName = "",
  defaultContact = "",
  defaultNote = "",
  submitLabel = "新增客戶",
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultName?: string;
  defaultContact?: string;
  defaultNote?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">客戶名稱</label>
        <input
          name="name"
          required
          defaultValue={defaultName}
          placeholder="例如：林氏設計工作室"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">聯絡方式</label>
        <input
          name="contact"
          defaultValue={defaultContact}
          placeholder="email / 電話 / Line 等"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">備註</label>
        <textarea
          name="note"
          rows={3}
          defaultValue={defaultNote}
          placeholder="其他想記下的資訊"
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
        />
      </div>

      <FormError message={state?.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
