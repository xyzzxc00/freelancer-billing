"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { requireUserId } from "@/lib/auth";
import { escapeHtml as esc } from "@/lib/html";
import type { ActionResult } from "@/lib/action-state";

const feedbackSchema = z.object({
  name: z.string().min(1, "請填寫名稱").max(100),
  email: z.union([z.literal(""), z.string().email("Email 格式不正確").max(200)]),
  message: z.string().min(10, "內容至少 10 個字").max(2000),
});

// 全站一小時最多收這麼多封回饋信——跟接案頁詢價一樣是全域計數的簡化取捨，
// 目的是防止單一使用者灌爆全站共用的 Resend 每日額度，不是精準的個人限流
const FEEDBACK_HOURLY_LIMIT = 10;

export async function sendFeedbackAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireUserId();

  // 蜜罐：真人不會填這個欄位，機器人會
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { success: "已送出，謝謝你的回饋！" };
  }

  const parsed = feedbackSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, message } = parsed.data;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.emailLog.count({
    where: { subject: { startsWith: "[意見回饋]" }, status: "sent", sentAt: { gte: hourAgo } },
  });
  if (recentCount >= FEEDBACK_HOURLY_LIMIT) {
    return { error: "回饋量較大，請一小時後再試" };
  }

  const sent = await sendEmail({
    to: serverEnv.adminEmail,
    subject: `[意見回饋] ${name}`,
    html: `
      <p><strong>姓名：</strong>${esc(name)}</p>
      <p><strong>Email：</strong>${esc(email)}</p>
      <hr />
      <p style="white-space:pre-wrap">${esc(message)}</p>
    `,
  });

  if (!sent) {
    return { error: "寄送失敗，請稍後再試" };
  }

  return { success: "已送出，謝謝你的回饋！" };
}
