"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createRecurringExpenseAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dayOfMonth = Number(formData.get("dayOfMonth") ?? 1);
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  if (!name || !amount || amount <= 0 || dayOfMonth < 1 || dayOfMonth > 28) {
    throw new Error("請填寫名稱、金額，並選擇 1-28 之間的每月日期");
  }

  await prisma.recurringExpense.create({
    data: { userId, name, amount, dayOfMonth, categoryId },
  });

  revalidatePath("/expenses/recurring");
  redirect("/expenses/recurring");
}

export async function toggleRecurringExpenseAction(recurringId: string, active: boolean) {
  const userId = await requireUserId();

  await prisma.recurringExpense.updateMany({
    where: { id: recurringId, userId },
    data: { active },
  });

  revalidatePath("/expenses/recurring");
}

export async function deleteRecurringExpenseAction(recurringId: string) {
  const userId = await requireUserId();

  await prisma.recurringExpense.deleteMany({ where: { id: recurringId, userId } });

  revalidatePath("/expenses/recurring");
}
