"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function markReceivablePaidAction(receivableId: string) {
  const userId = await requireUserId();

  await prisma.$transaction(async (tx) => {
    const receivable = await tx.receivable.findFirst({
      where: { id: receivableId, userId },
      include: { quote: true },
    });
    if (!receivable) return;

    await tx.receivable.update({
      where: { id: receivableId },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: "INCOME",
        amount: receivable.amount,
        category: "接案收入",
        note: receivable.quote.title,
        occurredAt: new Date(),
      },
    });
  });

  revalidatePath("/receivables");
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function setReceivableDueDateAction(receivableId: string, formData: FormData) {
  const userId = await requireUserId();

  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  const result = await prisma.receivable.updateMany({
    where: { id: receivableId, userId },
    data: { dueDate },
  });

  if (result.count === 0) return;

  revalidatePath("/receivables");
}
