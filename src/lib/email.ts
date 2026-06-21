import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "接案帳本 <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY 未設定，略過寄送 email：", subject);
    return;
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error("寄送 email 失敗：", error);
  }
}
