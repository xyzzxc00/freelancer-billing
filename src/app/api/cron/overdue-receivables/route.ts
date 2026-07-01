import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const overdue = await prisma.receivable.findMany({
      where: { status: "PENDING", dueDate: { lt: new Date() } },
      include: { profile: true, quote: { include: { client: true } } },
    });

    const byUser = new Map<string, typeof overdue>();
    for (const r of overdue) {
      byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
    }

    let notified = 0;
    let failed = 0;
    for (const [, receivables] of byUser) {
      const profile = receivables[0].profile;
      const rows = receivables
        .map(
          (r) =>
            `<li>${esc(r.quote.client.name)} — ${esc(r.quote.title)}：${currency.format(Number(r.amount))}</li>`
        )
        .join("");

      const ok = await sendEmail({
        to: profile.email,
        subject: `你有 ${receivables.length} 筆款項已逾期未收`,
        html: `<p>以下款項已超過到期日尚未收款：</p><ul>${rows}</ul>`,
      });
      if (ok) {
        notified += 1;
      } else {
        failed += 1;
        console.error(`寄信失敗 (${profile.email})`);
      }
    }

    // 有寄信失敗時主動通知管理員，避免客戶收不到逾期通知卻無人察覺
    if (failed > 0) {
      try {
        await sendEmail({
          to: serverEnv.adminEmail,
          subject: `[系統告警] 逾期通知寄送有 ${failed} 筆失敗`,
          html: `<p>overdue-receivables 排程本次寄送：成功 ${notified} 筆、失敗 ${failed} 筆（共 ${overdue.length} 筆逾期）。請檢查 Resend 寄信狀態與後台 log。</p>`,
        });
      } catch (alertErr) {
        console.error("寄送管理員告警信失敗:", alertErr);
      }
    }

    return Response.json({ notified, failed, overdueCount: overdue.length });
  } catch (err) {
    console.error("overdue-receivables cron 失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
