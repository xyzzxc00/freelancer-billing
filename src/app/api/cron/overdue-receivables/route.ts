import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { startOfTodayTaipei } from "@/lib/taipei";
import { escapeHtml as esc } from "@/lib/html";
import { verifyCronAuth } from "@/lib/cron-auth";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const DAY_MS = 24 * 60 * 60 * 1000;

// 逾期第 1、7、14 天各提醒一次，之後每 30 天一次——不是每天寄到收款為止
// （每天寄既騷擾使用者，也會無上限消耗全站共用的 Resend 每日額度）。
// 若 cron 某天沒跑，該次提醒會順延到下一個命中的提醒日，屬可接受的取捨。
function shouldRemind(daysOverdue: number): boolean {
  if (daysOverdue === 1 || daysOverdue === 7 || daysOverdue === 14) return true;
  return daysOverdue >= 30 && daysOverdue % 30 === 0;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 到期日「當天」還不算逾期，過了台灣時間的那一天才算
    const today = startOfTodayTaipei();
    const overdue = await prisma.receivable.findMany({
      where: { status: "PENDING", dueDate: { lt: today } },
      include: { profile: true, quote: { include: { client: true } }, client: true },
    });

    const byUser = new Map<string, typeof overdue>();
    for (const r of overdue) {
      byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
    }

    let notified = 0;
    let failed = 0;
    let held = 0;
    for (const [, receivables] of byUser) {
      // 任一筆命中提醒日才寄；信中仍列出該使用者全部逾期款項，一次看到完整狀況。
      // 天數以「台北今天零點 − 到期日」推算，cron 每天跑，同一天內結果固定。
      const hitsReminderDay = receivables.some((r) => {
        if (!r.dueDate) return false;
        const daysOverdue = Math.floor((today.getTime() - r.dueDate.getTime()) / DAY_MS) + 1;
        return shouldRemind(daysOverdue);
      });
      if (!hitsReminderDay) {
        held += 1;
        continue;
      }

      const profile = receivables[0].profile;
      const rows = receivables
        .map((r) => {
          const clientName = r.quote?.client.name ?? r.client?.name ?? "";
          const title = r.quote?.title ?? r.title ?? "定期請款";
          return `<li>${esc(clientName)} — ${esc(title)}：${currency.format(Number(r.amount))}</li>`;
        })
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

    return Response.json({ notified, failed, held, overdueCount: overdue.length });
  } catch (err) {
    console.error("overdue-receivables cron 失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
