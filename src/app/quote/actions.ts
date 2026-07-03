"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { calculateDepositSplit } from "@/lib/deposit";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

export async function recordQuoteViewedAction(token: string) {
  try {
    const result = await prisma.quote.updateMany({
      where: { shareToken: token, viewedAt: null },
      data: { viewedAt: new Date() },
    });

    // count > 0 代表這次真的是「第一次」開啟，才通知報價擁有者
    if (result.count > 0) {
      const quote = await prisma.quote.findUnique({
        where: { shareToken: token },
        include: { client: true, profile: true },
      });
      if (quote) {
        await sendEmail({
          to: quote.profile.email,
          subject: `${quote.client.name} 已開啟你的報價單「${quote.title}」`,
          html: `<p>${quote.client.name} 剛剛開啟了報價單「${quote.title}」的連結。</p>`,
        });
      }
    }
  } catch (err) {
    console.error("記錄報價單瀏覽失敗:", err);
  }
}

// 綁定 token/response 後交給 useActionState 呼叫
export async function respondToQuoteAction(
  token: string,
  response: "ACCEPTED" | "REJECTED",
  _prevState: ActionResult,
  formData: FormData
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

  const signerName = String(formData.get("signerName") ?? "").trim();
  if (response === "ACCEPTED" && !signerName) {
    return { error: "請填寫姓名以確認接受這份報價單" };
  }

  try {
    if (response === "ACCEPTED") {
      const subtotal = quote.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      // 與內部 acceptQuoteAction 一致：預設 30 天後到期，讓逾期提醒接手追蹤
      const finalDueDate = new Date();
      finalDueDate.setDate(finalDueDate.getDate() + 30);

      const quoteUpdate = prisma.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED", respondedAt: new Date(), signerName },
      });

      if (quote.depositPercent) {
        const { depositAmount, finalAmount } = calculateDepositSplit(subtotal, quote.depositPercent);
        await prisma.$transaction([
          quoteUpdate,
          prisma.receivable.create({
            data: { userId: quote.userId, quoteId: quote.id, kind: "DEPOSIT", amount: depositAmount, dueDate: new Date() },
          }),
          prisma.receivable.create({
            data: { userId: quote.userId, quoteId: quote.id, kind: "FINAL", amount: finalAmount, dueDate: finalDueDate },
          }),
        ]);
      } else {
        await prisma.$transaction([
          quoteUpdate,
          prisma.receivable.create({
            data: { userId: quote.userId, quoteId: quote.id, kind: "FULL", amount: subtotal, dueDate: finalDueDate },
          }),
        ]);
      }
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
