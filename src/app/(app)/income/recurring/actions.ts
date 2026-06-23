"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import type { ActionResult } from "@/lib/action-state";

export async function createRecurringIncomeAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dayOfMonth = Number(formData.get("dayOfMonth") ?? 1);
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  if (!name) {
    return { error: "請輸入名稱" };
  }
  if (!amount || amount <= 0) {
    return { error: "請填寫大於 0 的金額" };
  }
  if (dayOfMonth < 1 || dayOfMonth > 28) {
    return { error: "每月入帳日請選擇 1-28 之間" };
  }

  await prisma.recurringIncome.create({
    data: { userId, name, amount, dayOfMonth, categoryId },
  });

  revalidatePath("/income/recurring");
  redirectWithToast("/income/recurring", "已新增定期收入");
}

export async function toggleRecurringIncomeAction(recurringId: string, active: boolean) {
  const userId = await requireUserId();

  await prisma.recurringIncome.updateMany({
    where: { id: recurringId, userId },
    data: { active },
  });

  revalidatePath("/income/recurring");
}

export async function deleteRecurringIncomeAction(recurringId: string) {
  const userId = await requireUserId();

  await prisma.recurringIncome.deleteMany({ where: { id: recurringId, userId } });

  revalidatePath("/income/recurring");
}
