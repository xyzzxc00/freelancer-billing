import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { taipeiPreviousWeekRange, startOfTodayTaipei } from "@/lib/taipei";
import { currency } from "@/lib/currency";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { start, end } = taipeiPreviousWeekRange();
  const today = startOfTodayTaipei();

  const profiles = await prisma.profile.findMany({ select: { id: true, email: true } });

  const results = await Promise.all(profiles.map((profile) => sendSummaryFor(profile, start, end, today)));
  const sent = results.filter(Boolean).length;
  const failed = results.length - sent;

  return Response.json({ sent, failed, total: profiles.length });
}

async function sendSummaryFor(
  profile: { id: string; email: string },
  start: Date,
  end: Date,
  today: Date
): Promise<boolean> {
  const userId = profile.id;

  const [income, expense, pending, overdue, awaitingQuotes] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.receivable.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.receivable.aggregate({
      where: { userId, status: "PENDING", dueDate: { lt: today } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.quote.count({ where: { userId, status: "SENT" } }),
  ]);

  const weekIncome = Number(income._sum.amount ?? 0);
  const weekExpense = Number(expense._sum.amount ?? 0);
  const pendingTotal = Number(pending._sum.amount ?? 0);
  const overdueTotal = Number(overdue._sum.amount ?? 0);

  const html = `
    <p>上週經營摘要：</p>
    <ul>
      <li>本週收入：${currency.format(weekIncome)}</li>
      <li>本週支出：${currency.format(weekExpense)}</li>
      <li>待收款：${pending._count} 筆，共 ${currency.format(pendingTotal)}</li>
      <li>其中逾期：${overdue._count} 筆，共 ${currency.format(overdueTotal)}</li>
      <li>待客戶回覆的報價單：${awaitingQuotes} 張</li>
    </ul>
  `;

  return sendEmail({
    to: profile.email,
    subject: "本週經營摘要",
    html,
  });
}
