import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "接案帳本 <onboarding@resend.dev>";

// Resend 免費方案每日上限 100 封，留緩衝避免卡在邊界
const DAILY_LIMIT = Number(process.env.RESEND_DAILY_LIMIT ?? 90);

async function todaySentCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.emailLog.count({ where: { sentAt: { gte: startOfDay } } });
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
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await resend.emails.send({ from: FROM, to, subject, html });
      await prisma.emailLog.create({ data: {} });
      return true;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      } else {
        console.error(`寄送 email 失敗（已重試 ${MAX_RETRIES - 1} 次）：`, error);
      }
    }
  }
  return false;
}
