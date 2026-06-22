"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createRecurringIncomeAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dayOfMonth = Number(formData.get("dayOfMonth") ?? 1);
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  if (!name || !amount || amount <= 0 || dayOfMonth < 1 || dayOfMonth > 28) {
    throw new Error("請填寫名稱、金額，並選擇 1-28 之間的每月日期");
  }

  await prisma.recurringIncome.create({
    data: { userId, name, amount, dayOfMonth, categoryId },
  });

  revalidatePath("/income/recurring");
  redirect("/income/recurring");
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
