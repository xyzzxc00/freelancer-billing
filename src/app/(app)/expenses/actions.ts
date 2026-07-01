"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { transactionSchema } from "@/lib/schemas";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseExpenseForm(formData: FormData) {
  return transactionSchema.safeParse({
    amount: Number(formData.get("amount") ?? 0),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
}

export async function createExpenseAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseExpenseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { amount, occurredAt, note } = parsed.data;
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  try {
    await prisma.transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amount,
        categoryId,
        note: note ?? null,
        occurredAt: new Date(occurredAt),
      },
    });
  } catch (err) {
    console.error("新增支出失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已新增支出");
}

export async function updateExpenseAction(
  transactionId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseExpenseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { amount, occurredAt, note } = parsed.data;
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  try {
    await prisma.transaction.updateMany({
      where: { id: transactionId, userId, type: "EXPENSE" },
      data: { amount, categoryId, note: note ?? null, occurredAt: new Date(occurredAt) },
    });
  } catch (err) {
    console.error("更新支出失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已更新支出");
}

export async function deleteExpenseAction(transactionId: string) {
  const userId = await requireUserId();

  try {
    await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "EXPENSE" } });
  } catch (err) {
    console.error("刪除支出失敗:", err);
    redirectWithToast("/expenses", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已刪除支出");
}
