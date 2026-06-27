import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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

  const overdue = await prisma.receivable.findMany({
    where: { status: "PENDING", dueDate: { lt: new Date() } },
    include: { profile: true, quote: { include: { client: true } } },
  });

  const byUser = new Map<string, typeof overdue>();
  for (const r of overdue) {
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }

  for (const [, receivables] of byUser) {
    const profile = receivables[0].profile;
    const rows = receivables
      .map(
        (r) =>
          `<li>${esc(r.quote.client.name)} — ${esc(r.quote.title)}：${currency.format(Number(r.amount))}</li>`
      )
      .join("");

    await sendEmail({
      to: profile.email,
      subject: `你有 ${receivables.length} 筆款項已逾期未收`,
      html: `<p>以下款項已超過到期日尚未收款：</p><ul>${rows}</ul>`,
    });
  }

  return Response.json({ notified: byUser.size, overdueCount: overdue.length });
}
