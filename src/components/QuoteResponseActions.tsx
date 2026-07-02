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
    <div className="flex flex-col items-center sm:items-end gap-2">
      <div className="flex gap-2">
        <form action={rejectFormAction}>
          <button
            type="submit"
            disabled={pending}
            className="border border-gray-300 rounded-lg px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {rejectPending ? "處理中…" : "拒絕"}
          </button>
        </form>
        <form action={acceptFormAction}>
          <button
            type="submit"
            disabled={pending}
            className="bg-green-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {acceptPending ? "處理中…" : "接受報價"}
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
