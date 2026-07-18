"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { recurringReceivableSchema } from "@/lib/schemas";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseForm(formData: FormData) {
  return recurringReceivableSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0),
    clientId: String(formData.get("clientId") ?? ""),
    dayOfMonth: Number(formData.get("dayOfMonth") ?? 1),
    dueInDays: Number(formData.get("dueInDays") ?? 14),
  });
}

export async function createRecurringReceivableAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, amount, clientId, dayOfMonth, dueInDays } = parsed.data;

  // 客戶必須屬於自己，防止把定期請款掛到別人的客戶上
  const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!client) return { error: "找不到這個客戶" };

  try {
    await prisma.recurringReceivable.create({
      data: { userId, clientId, title, amount, dayOfMonth, dueInDays },
    });
  } catch (err) {
    console.error("新增定期請款失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/receivables/recurring");
  redirectWithToast("/receivables/recurring", "已新增定期請款");
}

export async function updateRecurringReceivableAction(
  recurringId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, amount, clientId, dayOfMonth, dueInDays } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!client) return { error: "找不到這個客戶" };

  try {
    await prisma.recurringReceivable.updateMany({
      where: { id: recurringId, userId },
      data: { title, amount, clientId, dayOfMonth, dueInDays },
    });
  } catch (err) {
    console.error("更新定期請款失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/receivables/recurring");
  redirectWithToast("/receivables/recurring", "已更新定期請款");
}

export async function toggleRecurringReceivableAction(recurringId: string, active: boolean) {
  const userId = await requireUserId();

  try {
    await prisma.recurringReceivable.updateMany({
      where: { id: recurringId, userId },
      data: { active },
    });
  } catch (err) {
    console.error("切換定期請款狀態失敗:", err);
    redirectWithToast("/receivables/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/receivables/recurring");
}

export async function deleteRecurringReceivableAction(recurringId: string) {
  const userId = await requireUserId();

  try {
    await prisma.recurringReceivable.deleteMany({ where: { id: recurringId, userId } });
  } catch (err) {
    console.error("刪除定期請款失敗:", err);
    redirectWithToast("/receivables/recurring", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/receivables/recurring");
}
