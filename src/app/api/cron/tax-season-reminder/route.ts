import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml as esc } from "@/lib/html";
import { verifyCronAuth } from "@/lib/cron-auth";

// 每年報稅季（5 月）前提醒使用者去看去年度的報稅彙總。
// 只寄給「去年真的有應稅收入」的使用者，避免打擾用不到這個功能的人。
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const lastYear = new Date().getFullYear() - 1;

    const quotes = await prisma.quote.findMany({
      where: {
        status: "ACCEPTED",
        taxMode: { not: "NONE" },
        respondedAt: { gte: new Date(lastYear, 0, 1), lt: new Date(lastYear + 1, 0, 1) },
      },
      select: { userId: true, profile: { select: { email: true } } },
    });

    const byUser = new Map<string, string>();
    for (const q of quotes) {
      byUser.set(q.userId, q.profile.email);
    }

    let notified = 0;
    let failed = 0;
    for (const [, email] of byUser) {
      const ok = await sendEmail({
        to: email,
        subject: `報稅季提醒：你的 ${lastYear} 年度報稅彙總已備好`,
        html: `<p>五月報稅季快到了，你 ${lastYear} 年度接案的委託報酬彙總已經整理好，可以到「報表 → 報稅彙總」查看試算結果，或直接匯出 CSV 對照扣繳憑單。</p><p>提醒：這只是試算參考，正式申報請以國稅局寄發的扣繳憑單為準。</p>`,
      });
      if (ok) {
        notified += 1;
      } else {
        failed += 1;
        console.error(`報稅提醒寄信失敗 (${esc(email)})`);
      }
    }

    return Response.json({ notified, failed, total: byUser.size });
  } catch (err) {
    console.error("tax-season-reminder cron 失敗:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
