"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createExpenseAction(formData: FormData) {
  const userId = await requireUserId();

  const amount = Number(formData.get("amount") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();
  const occurredAtRaw = String(formData.get("occurredAt") ?? "");

  if (!amount || amount <= 0 || !occurredAtRaw) {
    throw new Error("請填寫金額與日期");
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: "EXPENSE",
      amount,
      categoryId,
      note: note || null,
      occurredAt: new Date(occurredAtRaw),
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function deleteExpenseAction(transactionId: string) {
  const userId = await requireUserId();

  await prisma.transaction.deleteMany({ where: { id: transactionId, userId, type: "EXPENSE" } });

  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/dashboard");
}
