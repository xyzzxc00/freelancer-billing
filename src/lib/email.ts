import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "接案帳本 <onboarding@resend.dev>";

// Resend 免費方案每日上限 100 封，留緩衝避免卡在邊界
const DAILY_LIMIT = Number(process.env.RESEND_DAILY_LIMIT ?? 90);

async function todaySentCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  // 只計成功寄出的，失敗紀錄不占 Resend 額度
  return prisma.emailLog.count({
    where: { sentAt: { gte: startOfDay }, status: "sent" },
  });
}

// log 寫入失敗不能影響寄信結果（尤其不能讓成功寄出的信被誤判失敗而重寄）
async function logEmail(data: {
  to: string;
  subject: string;
  status: "sent" | "failed";
  error?: string;
}): Promise<void> {
  try {
    await prisma.emailLog.create({ data });
  } catch (error) {
    console.error("寫入 email log 失敗：", error);
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY 未設定，略過寄送 email：", subject);
    return false;
  }

  const sentToday = await todaySentCount();
  if (sentToday >= DAILY_LIMIT) {
    console.error(
      `今日寄信量已達 ${sentToday}/${DAILY_LIMIT}，略過寄送以避免超過 Resend 方案限制：${subject}`
    );
    return false;
  }

  const MAX_RETRIES = 2;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await resend.emails.send({ from: FROM, to, subject, html });
    } catch (error) {
      lastError = error;
      console.warn(`寄送 email 第 ${attempt}/${MAX_RETRIES} 次嘗試失敗：${subject}`, error);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      continue;
    }
    await logEmail({ to, subject, status: "sent" });
    return true;
  }

  console.error(`寄送 email 失敗（已重試 ${MAX_RETRIES - 1} 次）：${subject}`, lastError);
  await logEmail({
    to,
    subject,
    status: "failed",
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  return false;
}
