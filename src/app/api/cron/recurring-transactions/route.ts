import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function currentYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const yearMonth = currentYearMonth(now);
  const today = now.getDate();

  const [dueExpenses, dueIncomes] = await Promise.all([
    prisma.recurringExpense.findMany({
      where: { active: true, dayOfMonth: { lte: today }, NOT: { lastGeneratedYearMonth: yearMonth } },
    }),
    prisma.recurringIncome.findMany({
      where: { active: true, dayOfMonth: { lte: today }, NOT: { lastGeneratedYearMonth: yearMonth } },
    }),
  ]);

  let created = 0;

  for (const r of dueExpenses) {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: r.userId,
          type: "EXPENSE",
          amount: r.amount,
          categoryId: r.categoryId,
          note: r.name,
          occurredAt: now,
        },
      }),
      prisma.recurringExpense.update({
        where: { id: r.id },
        data: { lastGeneratedYearMonth: yearMonth },
      }),
    ]);
    created += 1;
  }

  for (const r of dueIncomes) {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: r.userId,
          type: "INCOME",
          amount: r.amount,
          incomeCategoryId: r.categoryId,
          note: r.name,
          occurredAt: now,
        },
      }),
      prisma.recurringIncome.update({
        where: { id: r.id },
        data: { lastGeneratedYearMonth: yearMonth },
      }),
    ]);
    created += 1;
  }

  return Response.json({
    checkedExpenses: dueExpenses.length,
    checkedIncomes: dueIncomes.length,
    created,
  });
}
