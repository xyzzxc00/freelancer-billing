"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function recordQuoteViewedAction(token: string) {
  try {
    await prisma.quote.updateMany({
      where: { shareToken: token, viewedAt: null },
      data: { viewedAt: new Date() },
    });
  } catch (err) {
    console.error("記錄報價單瀏覽失敗:", err);
  }
}

export async function respondToQuoteAction(token: string, response: "ACCEPTED" | "REJECTED") {
  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: { items: true, client: true, profile: true },
  });

  if (!quote || quote.status !== "SENT") {
    return;
  }

  try {
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
  } catch (err) {
    console.error("回覆報價單失敗:", err);
    return;
  }

  const verb = response === "ACCEPTED" ? "接受了" : "拒絕了";
  await sendEmail({
    to: quote.profile.email,
    subject: `${quote.client.name} ${verb}你的報價單「${quote.title}」`,
    html: `<p>${quote.client.name} 剛剛${verb}你的報價單「${quote.title}」。</p>`,
  });

  revalidatePath(`/quote/${token}`);
}
