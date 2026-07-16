"use server";

import { createIncomeAction } from "@/app/(app)/income/actions";
import { createExpenseAction } from "@/app/(app)/expenses/actions";
import type { ActionResult } from "@/lib/action-state";

// 浮動快速記帳按鈕用的統一入口：依 type 轉呼叫既有的 createIncomeAction / createExpenseAction，
// 避免重複寫一次建立交易的邏輯。收入的分類欄位名稱是 incomeCategoryId，這裡統一用 categoryId
// 收表單，再依 type 轉成對應欄位名稱餵給底層 action。
export async function quickAddTransactionAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const type = String(formData.get("type") ?? "expense");

  if (type === "income") {
    formData.set("incomeCategoryId", String(formData.get("categoryId") ?? ""));
    return createIncomeAction(_prevState, formData);
  }
  return createExpenseAction(_prevState, formData);
}
