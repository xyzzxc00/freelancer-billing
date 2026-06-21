"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function respondToQuoteAction(token: string, response: "ACCEPTED" | "REJECTED") {
  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: { items: true },
  });

  if (!quote || quote.status !== "SENT") {
    return;
  }

  if (response === "ACCEPTED") {
    const subtotal = quote.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0
    );
    await prisma.$transaction([
      prisma.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.receivable.upsert({
        where: { quoteId: quote.id },
        create: { userId: quote.userId, quoteId: quote.id, amount: subtotal },
        update: { amount: subtotal },
      }),
    ]);
  } else {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });
  }

  revalidatePath(`/quote/${token}`);
}
