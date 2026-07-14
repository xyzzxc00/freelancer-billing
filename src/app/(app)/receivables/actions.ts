"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { extractEmail } from "@/lib/extract-email";
import { currency } from "@/lib/currency";
import { GENERIC_ACTION_ERROR } from "@/lib/action-state";

const kindLabel: Record<string, string> = { DEPOSIT: "訂金", FINAL: "尾款" };

export async function markReceivablePaidAction(receivableId: string) {
  const userId = await requireUserId();

  try {
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
          receivableId: receivable.id,
        },
      });
    });
  } catch (err) {
    console.error("標記已收款失敗:", err);
    redirectWithToast("/receivables", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/receivables");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  redirectWithToast("/receivables", "已標記為已收款");
}

export async function sendDunningEmailAction(receivableId: string) {
  const userId = await requireUserId();

  const receivable = await prisma.receivable.findFirst({
    where: { id: receivableId, userId },
    include: { quote: { include: { client: true } } },
  });
  if (!receivable) {
    redirectWithToast("/receivables", GENERIC_ACTION_ERROR, "error");
  }

  const clientEmail = extractEmail(receivable.quote.client.contact ?? "");
  if (!clientEmail) {
    redirectWithToast("/receivables", "這位客戶沒有留 email，無法寄送催款信", "error");
  }

  const label = kindLabel[receivable.kind] ? `（${kindLabel[receivable.kind]}）` : "";
  const ok = await sendEmail({
    to: clientEmail,
    subject: `款項提醒：${receivable.quote.title}${label}`,
    html: `<p>您好，</p><p>提醒您「${escapeHtml(receivable.quote.title)}」${label}尚有 ${currency.format(Number(receivable.amount))} 款項待付款，麻煩撥空處理，謝謝！</p>`,
  });

  revalidatePath("/receivables");
  redirectWithToast(
    "/receivables",
    ok ? "催款信已寄出" : "催款信寄送失敗，請稍後再試",
    ok ? "success" : "error"
  );
}

export async function setReceivableDueDateAction(receivableId: string, formData: FormData) {
  const userId = await requireUserId();

  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  let result;
  try {
    result = await prisma.receivable.updateMany({
      where: { id: receivableId, userId },
      data: { dueDate },
    });
  } catch (err) {
    console.error("更新到期日失敗:", err);
    redirectWithToast("/receivables", GENERIC_ACTION_ERROR, "error");
  }

  if (result.count === 0) return;

  revalidatePath("/receivables");
}
