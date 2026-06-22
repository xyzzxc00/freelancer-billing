"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createIncomeAction(formData: FormData) {
  const userId = await requireUserId();

  const amount = Number(formData.get("amount") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const occurredAtRaw = String(formData.get("occurredAt") ?? "");

  if (!amount || amount <= 0 || !occurredAtRaw) {
    throw new Error("請填寫金額與日期");
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: "INCOME",
      amount,
      category: category || null,
      note: note || null,
      occurredAt: new Date(occurredAtRaw),
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}

export async function deleteTransactionAction(transactionId: string) {
  const userId = await requireUserId();

  await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
