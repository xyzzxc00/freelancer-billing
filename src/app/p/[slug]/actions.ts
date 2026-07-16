"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml as esc } from "@/lib/html";
import type { ActionResult } from "@/lib/action-state";

const inquirySchema = z.object({
  name: z.string().min(1, "請填寫姓名").max(100),
  contact: z.string().min(1, "請留下 email 或聯絡方式").max(200),
  message: z.string().min(10, "請簡單描述你的需求（至少 10 個字）").max(2000),
});

export async function submitInquiryAction(
  slug: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  // 蜜罐：真人不會填這個欄位，機器人會
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { success: "已送出，謝謝你的訊息！" };
  }

  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: { id: true, email: true },
  });
  if (!profile) {
    return { error: "找不到這個接案頁" };
  }

  const parsed = inquirySchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    contact: String(formData.get("contact") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, contact, message } = parsed.data;

  try {
    await prisma.inquiry.create({
      data: { userId: profile.id, name, contact, message },
    });
  } catch (err) {
    console.error("建立詢價失敗:", err);
    return { error: "送出失敗，請稍後再試" };
  }

  // 詢價已成功寫入，通知信寄送失敗不影響結果
  try {
    await sendEmail({
      to: profile.email,
      subject: `你的接案頁收到新詢價：${name}`,
      html: `<p><strong>姓名：</strong>${esc(name)}</p><p><strong>聯絡方式：</strong>${esc(contact)}</p><hr /><p style="white-space:pre-wrap">${esc(message)}</p>`,
    });
  } catch (err) {
    console.error("詢價通知信寄送失敗:", err);
  }

  return { success: "已送出，謝謝你的訊息，我會盡快跟你聯絡！" };
}
