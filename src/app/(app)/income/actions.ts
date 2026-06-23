"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import type { ActionResult } from "@/lib/action-state";

export async function createIncomeAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const amount = Number(formData.get("amount") ?? 0);
  const incomeCategoryId = String(formData.get("incomeCategoryId") ?? "") || null;
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
      type: "INCOME",
      amount,
      incomeCategoryId,
      note: note || null,
      occurredAt: new Date(occurredAtRaw),
    },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/income", "已新增收入");
}

export async function deleteIncomeAction(transactionId: string) {
  const userId = await requireUserId();

  await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "INCOME" } });

  revalidatePath("/income");
  revalidatePath("/dashboard");
}
