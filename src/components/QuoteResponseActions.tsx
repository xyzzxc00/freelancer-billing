"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/action-state";

type BoundAction = (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;

export function QuoteResponseActions({
  acceptAction,
  rejectAction,
}: {
  acceptAction: BoundAction;
  rejectAction: BoundAction;
}) {
  const [acceptState, acceptFormAction, acceptPending] = useActionState(acceptAction, undefined);
  const [rejectState, rejectFormAction, rejectPending] = useActionState(rejectAction, undefined);

  const pending = acceptPending || rejectPending;
  const error = acceptState?.error ?? rejectState?.error;

  return (
    <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
        <form action={rejectFormAction}>
          <button
            type="submit"
            disabled={pending}
            className="w-full border border-gray-300 rounded-lg px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {rejectPending ? "處理中…" : "拒絕"}
          </button>
        </form>
        <form action={acceptFormAction} className="flex gap-2">
          <input
            name="signerName"
            required
            placeholder="您的姓名"
            disabled={pending}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-0 flex-1 sm:w-32 bg-white text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 bg-green-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {acceptPending ? "處理中…" : "接受報價"}
          </button>
        </form>
      </div>
      <p className="text-xs text-gray-400">接受報價前請填寫您的姓名以完成確認</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
