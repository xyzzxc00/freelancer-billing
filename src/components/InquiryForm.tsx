"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

type BoundAction = (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;

export function InquiryForm({ action }: { action: BoundAction }) {
  const [state, formAction] = useActionState(action, undefined);

  if (state?.success) {
    return (
      <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-6 text-sm text-center">
        <p className="text-base mb-1">✓</p>
        <p className="text-gray-700">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {/* 蜜罐欄位：對使用者隱藏，機器人會填 */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: "none" }}
      />
      <div>
        <label className="text-sm text-gray-500 block mb-1">姓名</label>
        <input
          name="name"
          required
          className="border border-gray-200 rounded-md px-3 py-2 text-sm w-full bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-1">聯絡方式</label>
        <input
          name="contact"
          required
          placeholder="email / 電話 / Line 等"
          className="border border-gray-200 rounded-md px-3 py-2 text-sm w-full bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-1">你的需求</label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="簡單描述你的需求、預算、時程…"
          className="border border-gray-200 rounded-md px-3 py-2 text-sm w-full resize-none bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>
      <FormError message={state?.error} />
      <SubmitButton
        pendingLabel="送出中…"
        className="bg-gray-900 text-white rounded-md py-2 text-sm font-medium"
      >
        送出詢價
      </SubmitButton>
    </form>
  );
}
