"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

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

// 綁定 token/response 後交給 useActionState 呼叫（呼叫時會多帶 state 與 formData，這裡用不到）
export async function respondToQuoteAction(
  token: string,
  response: "ACCEPTED" | "REJECTED"
): Promise<ActionResult> {
  let quote;
  try {
    quote = await prisma.quote.findUnique({
      where: { shareToken: token },
      include: { items: true, client: true, profile: true },
    });
  } catch (err) {
    console.error("查詢報價單失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  if (!quote) {
    return { error: "找不到這份報價單" };
  }
  if (quote.status !== "SENT") {
    return { error: "這份報價單已經回覆過了，請重新整理頁面查看最新狀態" };
  }

  try {
    if (response === "ACCEPTED") {
      const subtotal = quote.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      // 與內部 acceptQuoteAction 一致：預設 30 天後到期，讓逾期提醒接手追蹤
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await prisma.$transaction([
        prisma.quote.update({
          where: { id: quote.id },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        }),
        prisma.receivable.upsert({
          where: { quoteId: quote.id },
          create: { userId: quote.userId, quoteId: quote.id, amount: subtotal, dueDate },
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
    return { error: GENERIC_ACTION_ERROR };
  }

  // 回覆已成功寫入，通知信寄送失敗不影響結果
  try {
    const verb = response === "ACCEPTED" ? "接受了" : "拒絕了";
    await sendEmail({
      to: quote.profile.email,
      subject: `${quote.client.name} ${verb}你的報價單「${quote.title}」`,
      html: `<p>${quote.client.name} 剛剛${verb}你的報價單「${quote.title}」。</p>`,
    });
  } catch (err) {
    console.error("報價單回覆通知信寄送失敗:", err);
  }

  revalidatePath(`/quote/${token}`);
}
