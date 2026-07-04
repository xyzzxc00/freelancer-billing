import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { taipeiYearMonth, taipeiDayOfMonth, startOfTodayTaipei } from "@/lib/taipei";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 以台灣日曆日判斷「今天幾號、這是哪個月」，避免伺服器 UTC 在月底/月初的邊界差一天
  const yearMonth = taipeiYearMonth();
  const today = taipeiDayOfMonth();
  // 交易日期記台灣「今天」的日期（UTC 午夜），與手動記帳的日期欄位存法一致
  const occurredAt = startOfTodayTaipei();

  const [dueExpenses, dueIncomes] = await Promise.all([
    prisma.recurringExpense.findMany({
      where: { active: true, dayOfMonth: { lte: today }, NOT: { lastGeneratedYearMonth: yearMonth } },
    }),
    prisma.recurringIncome.findMany({
      where: { active: true, dayOfMonth: { lte: today }, NOT: { lastGeneratedYearMonth: yearMonth } },
    }),
  ]);

  let created = 0;
  const errors: string[] = [];

  for (const r of dueExpenses) {
    try {
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: r.userId,
            type: "EXPENSE",
            amount: r.amount,
            categoryId: r.categoryId,
            note: r.name,
            occurredAt,
          },
        }),
        prisma.recurringExpense.update({
          where: { id: r.id },
          data: { lastGeneratedYearMonth: yearMonth },
        }),
      ]);
      created += 1;
    } catch (err) {
      console.error(`定期支出建立失敗 (id=${r.id}):`, err);
      errors.push(r.id);
    }
  }

  for (const r of dueIncomes) {
    try {
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: r.userId,
            type: "INCOME",
            amount: r.amount,
            incomeCategoryId: r.categoryId,
            note: r.name,
            occurredAt,
          },
        }),
        prisma.recurringIncome.update({
          where: { id: r.id },
          data: { lastGeneratedYearMonth: yearMonth },
        }),
      ]);
      created += 1;
    } catch (err) {
      console.error(`定期收入建立失敗 (id=${r.id}):`, err);
      errors.push(r.id);
    }
  }

  return Response.json({
    checkedExpenses: dueExpenses.length,
    checkedIncomes: dueIncomes.length,
    created,
    errors: errors.length > 0 ? errors : undefined,
  });
}
