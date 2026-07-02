"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { recurringSchema } from "@/lib/schemas";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseRecurringForm(formData: FormData) {
  return recurringSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0),
    dayOfMonth: Number(formData.get("dayOfMonth") ?? 1),
  });
}

export async function createRecurringIncomeAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseRecurringForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, amount, dayOfMonth } = parsed.data;
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  try {
    await prisma.recurringIncome.create({
      data: { userId, name, amount, dayOfMonth, categoryId },
    });
  } catch (err) {
    console.error("新增定期收入失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income/recurring");
  redirectWithToast("/income/recurring", "已新增定期收入");
}

export async function updateRecurringIncomeAction(
  recurringId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseRecurringForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, amount, dayOfMonth } = parsed.data;
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  try {
    await prisma.recurringIncome.updateMany({
      where: { id: recurringId, userId },
      data: { name, amount, dayOfMonth, categoryId },
    });
  } catch (err) {
    console.error("更新定期收入失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income/recurring");
  redirectWithToast("/income/recurring", "已更新定期收入");
}

export async function toggleRecurringIncomeAction(recurringId: string, active: boolean) {
  const userId = await requireUserId();

  try {
    await prisma.recurringIncome.updateMany({
      where: { id: recurringId, userId },
      data: { active },
    });
  } catch (err) {
    console.error("切換定期收入狀態失敗:", err);
    redirectWithToast("/income/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/income/recurring");
}

export async function deleteRecurringIncomeAction(recurringId: string) {
  const userId = await requireUserId();

  try {
    await prisma.recurringIncome.deleteMany({ where: { id: recurringId, userId } });
  } catch (err) {
    console.error("刪除定期收入失敗:", err);
    redirectWithToast("/income/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/income/recurring");
}
