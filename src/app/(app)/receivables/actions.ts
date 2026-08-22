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

// 報價單來源的應收款用 quote 的標題/客戶，定期請款產生的用自身欄位
function receivableTitle(r: { title: string | null; quote: { title: string } | null }) {
  return r.quote?.title ?? r.title ?? "定期請款";
}

export async function markReceivablePaidAction(receivableId: string) {
  const userId = await requireUserId();

  let outcome: "paid" | "missing" | "already" = "missing";
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findFirst({
        where: { id: receivableId, userId },
        include: { quote: true },
      });
      if (!receivable) return "missing" as const;

      // 帶 status: "PENDING" 條件的原子鎖定：連點兩下時第二次落到「已處理過」的
      // 明確訊息，而不是靠 transactions.receivableId 的 unique constraint
      // 讓整筆交易 rollback、只顯示看不懂的通用錯誤
      const updated = await tx.receivable.updateMany({
        where: { id: receivableId, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (updated.count === 0) return "already" as const;

      await tx.transaction.create({
        data: {
          userId,
          type: "INCOME",
          amount: receivable.amount,
          category: "接案收入",
          note: receivableTitle(receivable),
          occurredAt: new Date(),
          receivableId: receivable.id,
        },
      });
      return "paid" as const;
    });
  } catch (err) {
    console.error("標記已收款失敗:", err);
    redirectWithToast("/receivables", GENERIC_ACTION_ERROR, "error");
  }

  if (outcome === "missing") {
    redirectWithToast("/receivables", "找不到這筆款項", "error");
  }
  if (outcome === "already") {
    redirectWithToast("/receivables", "這筆款項先前已標記為已收款", "error");
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
    include: { quote: { include: { client: true } }, client: true },
  });
  if (!receivable) {
    redirectWithToast("/receivables", GENERIC_ACTION_ERROR, "error");
  }

  const client = receivable.quote?.client ?? receivable.client;
  const clientEmail = extractEmail(client?.contact ?? "");
  if (!clientEmail) {
    redirectWithToast("/receivables", "這位客戶沒有留 email，無法寄送催款信", "error");
  }

  const title = receivableTitle(receivable);
  const label = kindLabel[receivable.kind] ? `（${kindLabel[receivable.kind]}）` : "";
  const subject = `款項提醒：${title}${label}`;

  // 24 小時冷卻：同一筆款項不重複寄催款信（防連點、也保護全站共用的
  // Resend 每日額度）。用既有的 EmailLog 判斷，不用加新欄位。
  const cooldownStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentlySent = await prisma.emailLog.findFirst({
    where: { to: clientEmail, subject, status: "sent", sentAt: { gte: cooldownStart } },
    select: { id: true },
  });
  if (recentlySent) {
    redirectWithToast("/receivables", "這筆款項 24 小時內已寄過催款信，請稍後再寄", "error");
  }

  const ok = await sendEmail({
    to: clientEmail,
    subject,
    html: `<p>您好，</p><p>提醒您「${escapeHtml(title)}」${label}尚有 ${currency.format(Number(receivable.amount))} 款項待付款，麻煩撥空處理，謝謝！</p>`,
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
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    redirectWithToast("/receivables", "日期格式不正確", "error");
  }

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
  redirectWithToast("/receivables", dueDate ? "已更新收款期限" : "已清除收款期限");
}
