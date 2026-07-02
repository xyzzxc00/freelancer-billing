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

export async function createRecurringExpenseAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseRecurringForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, amount, dayOfMonth } = parsed.data;
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  try {
    await prisma.recurringExpense.create({
      data: { userId, name, amount, dayOfMonth, categoryId },
    });
  } catch (err) {
    console.error("新增定期支出失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses/recurring");
  redirectWithToast("/expenses/recurring", "已新增定期支出");
}

export async function updateRecurringExpenseAction(
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
    await prisma.recurringExpense.updateMany({
      where: { id: recurringId, userId },
      data: { name, amount, dayOfMonth, categoryId },
    });
  } catch (err) {
    console.error("更新定期支出失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses/recurring");
  redirectWithToast("/expenses/recurring", "已更新定期支出");
}

export async function toggleRecurringExpenseAction(recurringId: string, active: boolean) {
  const userId = await requireUserId();

  try {
    await prisma.recurringExpense.updateMany({
      where: { id: recurringId, userId },
      data: { active },
    });
  } catch (err) {
    console.error("切換定期支出狀態失敗:", err);
    redirectWithToast("/expenses/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/expenses/recurring");
}

export async function deleteRecurringExpenseAction(recurringId: string) {
  const userId = await requireUserId();

  try {
    await prisma.recurringExpense.deleteMany({ where: { id: recurringId, userId } });
  } catch (err) {
    console.error("刪除定期支出失敗:", err);
    redirectWithToast("/expenses/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/expenses/recurring");
}
