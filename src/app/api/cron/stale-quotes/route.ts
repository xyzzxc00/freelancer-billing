import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const STALE_AFTER_DAYS = 5;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const staleBefore = new Date();
  staleBefore.setDate(staleBefore.getDate() - STALE_AFTER_DAYS);

  const staleQuotes = await prisma.quote.findMany({
    where: { status: "SENT", sentAt: { lt: staleBefore } },
    include: { profile: true, client: true },
  });

  const byUser = new Map<string, typeof staleQuotes>();
  for (const q of staleQuotes) {
    byUser.set(q.userId, [...(byUser.get(q.userId) ?? []), q]);
  }

  for (const [, quotes] of byUser) {
    const profile = quotes[0].profile;
    const rows = quotes
      .map((q) => `<li>${esc(q.client.name)} — ${esc(q.title)}</li>`)
      .join("");

    await sendEmail({
      to: profile.email,
      subject: `你有 ${quotes.length} 張報價單客戶還沒回應`,
      html: `<p>以下報價單發出已超過 ${STALE_AFTER_DAYS} 天，客戶尚未接受或拒絕，要不要跟催一下：</p><ul>${rows}</ul>`,
    });
  }

  return Response.json({ notified: byUser.size, staleCount: staleQuotes.length });
}
