"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { transactionSchema } from "@/lib/schemas";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseIncomeForm(formData: FormData) {
  return transactionSchema.safeParse({
    amount: Number(formData.get("amount") ?? 0),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
}

export async function createIncomeAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseIncomeForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { amount, occurredAt, note } = parsed.data;
  const incomeCategoryId = String(formData.get("incomeCategoryId") ?? "") || null;

  try {
    await prisma.transaction.create({
      data: {
        userId,
        type: "INCOME",
        amount,
        incomeCategoryId,
        note: note ?? null,
        occurredAt: new Date(occurredAt),
      },
    });
  } catch (err) {
    console.error("新增收入失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/income", "已新增收入");
}

export async function updateIncomeAction(
  transactionId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseIncomeForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { amount, occurredAt, note } = parsed.data;
  const incomeCategoryId = String(formData.get("incomeCategoryId") ?? "") || null;

  try {
    await prisma.transaction.updateMany({
      where: { id: transactionId, userId, type: "INCOME" },
      data: { amount, incomeCategoryId, note: note ?? null, occurredAt: new Date(occurredAt) },
    });
  } catch (err) {
    console.error("更新收入失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/income", "已更新收入");
}

export async function deleteIncomeAction(transactionId: string) {
  const userId = await requireUserId();

  try {
    await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "INCOME" } });
  } catch (err) {
    console.error("刪除收入失敗:", err);
    redirectWithToast("/income", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/income", "已刪除收入");
}
