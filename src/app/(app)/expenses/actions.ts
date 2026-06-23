"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import type { ActionResult } from "@/lib/action-state";

export async function createExpenseAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const amount = Number(formData.get("amount") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();
  const occurredAtRaw = String(formData.get("occurredAt") ?? "");

  if (!amount || amount <= 0) {
    return { error: "請填寫大於 0 的金額" };
  }
  if (!occurredAtRaw) {
    return { error: "請選擇日期" };
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: "EXPENSE",
      amount,
      categoryId,
      note: note || null,
      occurredAt: new Date(occurredAtRaw),
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已新增支出");
}

export async function deleteExpenseAction(transactionId: string) {
  const userId = await requireUserId();

  await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "EXPENSE" } });

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
}
