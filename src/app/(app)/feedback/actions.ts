"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-state";

const feedbackSchema = z.object({
  name: z.string().min(1, "請填寫名稱").max(100),
  email: z.union([z.literal(""), z.string().email("Email 格式不正確").max(200)]),
  message: z.string().min(10, "內容至少 10 個字").max(2000),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

  await sendEmail({
    to: serverEnv.adminEmail,
    subject: `[意見回饋] ${name}`,
    html: `
      <p><strong>姓名：</strong>${esc(name)}</p>
      <p><strong>Email：</strong>${esc(email)}</p>
      <hr />
      <p style="white-space:pre-wrap">${esc(message)}</p>
    `,
  });

  return { success: "已送出，謝謝你的回饋！" };
}
