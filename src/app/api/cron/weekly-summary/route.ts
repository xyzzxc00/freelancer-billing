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

  // 分批處理：一次全開會對資料庫 pooler 同時打 5×N 個查詢；
  // 寄信本身已由 email.ts 的節流佇列序列化，這裡只需要控查詢並發
  const CHUNK_SIZE = 5;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (let i = 0; i < profiles.length; i += CHUNK_SIZE) {
    const results = await Promise.all(
      profiles.slice(i, i + CHUNK_SIZE).map((profile) => sendSummaryFor(profile, start, end, today))
    );
    for (const r of results) {
      if (r === "sent") sent += 1;
      else if (r === "failed") failed += 1;
      else skipped += 1;
    }
  }

  return Response.json({ sent, failed, skipped, total: profiles.length });
}

async function sendSummaryFor(
  profile: { id: string; email: string },
  start: Date,
  end: Date,
  today: Date
): Promise<"sent" | "failed" | "skipped"> {
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

  // 上週沒有任何收支、也沒有待收款或待回覆報價的使用者，寄「全部為零」的摘要
  // 只是騷擾，也浪費全站共用的每日寄信額度
  if (weekIncome === 0 && weekExpense === 0 && pending._count === 0 && awaitingQuotes === 0) {
    return "skipped";
  }

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

  const ok = await sendEmail({
    to: profile.email,
    subject: "本週經營摘要",
    html,
  });
  return ok ? "sent" : "failed";
}
