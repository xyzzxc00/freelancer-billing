"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export function ConfirmDeleteButton({
  action,
  confirmMessage = "確定要刪除嗎？此操作無法復原。",
  successMessage = "已刪除",
  className = "text-sm text-[color:var(--danger-fg)] hover:underline px-1",
  label = "刪除",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  successMessage?: string;
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={`${className} disabled:opacity-50`}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            await action();
            toast.success(successMessage);
          } catch (e) {
            if (isRedirectError(e)) throw e;
            toast.error("刪除失敗，請稍後再試");
          }
        });
      }}
    >
      {isPending ? "刪除中…" : label}
    </button>
  );
}
