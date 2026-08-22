import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { startOfTodayTaipei } from "@/lib/taipei";
import { escapeHtml as esc } from "@/lib/html";
import { verifyCronAuth } from "@/lib/cron-auth";

const STALE_AFTER_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// 送出後第 5 天提醒一次，之後每 7 天一次（第 5、12、19… 天）——
// 不是過了 5 天後每天都寄，避免騷擾使用者、消耗全站共用的 Resend 額度
function shouldRemind(staleDays: number): boolean {
  return staleDays >= STALE_AFTER_DAYS && (staleDays - STALE_AFTER_DAYS) % 7 === 0;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 天數以台北日曆日計（送出隔天算第 1 天），跟提醒窗口用同一套定義，
    // 避免「晚上送出的報價單」因不足整數天而錯過第 5 天的首次提醒
    const today = startOfTodayTaipei();
    const cutoff = new Date(today.getTime() - (STALE_AFTER_DAYS - 1) * DAY_MS);

    const staleQuotes = await prisma.quote.findMany({
      where: { status: "SENT", sentAt: { lt: cutoff } },
      include: { profile: true, client: true },
    });

    const byUser = new Map<string, typeof staleQuotes>();
    for (const q of staleQuotes) {
      byUser.set(q.userId, [...(byUser.get(q.userId) ?? []), q]);
    }

    let notified = 0;
    let failed = 0;
    let held = 0;
    for (const [, quotes] of byUser) {
      const hitsReminderDay = quotes.some((q) => {
        if (!q.sentAt) return false;
        const staleDays = Math.floor((today.getTime() - q.sentAt.getTime()) / DAY_MS) + 1;
        return shouldRemind(staleDays);
      });
      if (!hitsReminderDay) {
        held += 1;
        continue;
      }

      const profile = quotes[0].profile;
      const rows = quotes
        .map((q) => `<li>${esc(q.client.name)} — ${esc(q.title)}</li>`)
        .join("");

      const ok = await sendEmail({
        to: profile.email,
        subject: `你有 ${quotes.length} 張報價單客戶還沒回應`,
        html: `<p>以下報價單發出已超過 ${STALE_AFTER_DAYS} 天，客戶尚未接受或拒絕，要不要跟催一下：</p><ul>${rows}</ul>`,
      });
      if (ok) {
        notified += 1;
      } else {
        failed += 1;
        console.error(`寄信失敗 (${profile.email})`);
      }
    }

    return Response.json({ notified, failed, held, staleCount: staleQuotes.length });
  } catch (err) {
    console.error("stale-quotes cron 失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
