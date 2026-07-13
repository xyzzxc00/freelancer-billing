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
  let revertedReceivable = false;

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, type: "INCOME" },
        select: { receivableId: true },
      });
      if (!transaction) return;

      await tx.transaction.delete({ where: { id: transactionId } });

      // 這筆收入是標記應收款「已收款」時自動建立的，刪除收入等於撤銷那個標記，
      // 應收款要跟著改回待收款，不然帳上會出現「已收款但找不到收入記錄」的斷層。
      if (transaction.receivableId) {
        await tx.receivable.update({
          where: { id: transaction.receivableId },
          data: { status: "PENDING", paidAt: null },
        });
        revertedReceivable = true;
      }
    });
  } catch (err) {
    console.error("刪除收入失敗:", err);
    redirectWithToast("/income", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/receivables");
  redirectWithToast(
    "/income",
    revertedReceivable ? "已刪除收入，對應的應收款已改回待收款" : "已刪除收入"
  );
}
