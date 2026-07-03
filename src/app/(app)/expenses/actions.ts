"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { transactionSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseExpenseForm(formData: FormData) {
  return transactionSchema.safeParse({
    amount: Number(formData.get("amount") ?? 0),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
}

async function deleteReceiptObject(path: string) {
  try {
    const supabase = await createClient();
    await supabase.storage.from("receipts").remove([path]);
  } catch (err) {
    console.error("刪除憑證檔案失敗:", err);
  }
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
  const receiptUrl = String(formData.get("receiptUrl") ?? "").trim() || null;

  try {
    await prisma.transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amount,
        categoryId,
        note: note ?? null,
        receiptUrl,
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
  const receiptUrl = String(formData.get("receiptUrl") ?? "").trim() || null;

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, type: "EXPENSE" },
    select: { receiptUrl: true },
  });
  if (!existing) {
    return { error: "找不到這筆支出" };
  }

  try {
    await prisma.transaction.updateMany({
      where: { id: transactionId, userId, type: "EXPENSE" },
      data: { amount, categoryId, note: note ?? null, receiptUrl, occurredAt: new Date(occurredAt) },
    });
  } catch (err) {
    console.error("更新支出失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  if (existing.receiptUrl && existing.receiptUrl !== receiptUrl) {
    await deleteReceiptObject(existing.receiptUrl);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已更新支出");
}

export async function deleteExpenseAction(transactionId: string) {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, type: "EXPENSE" },
    select: { receiptUrl: true },
  });

  try {
    await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "EXPENSE" } });
  } catch (err) {
    console.error("刪除支出失敗:", err);
    redirectWithToast("/expenses", GENERIC_ACTION_ERROR, "error");
  }

  if (existing?.receiptUrl) {
    await deleteReceiptObject(existing.receiptUrl);
  }

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/expenses", "已刪除支出");
}
