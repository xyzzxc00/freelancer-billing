import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { taipeiYearMonth, taipeiDayOfMonth, startOfTodayTaipei } from "@/lib/taipei";
import { buildGeneratedReceivable } from "@/lib/recurring-receivable";
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

  // 「這個月還沒產生過」：Prisma 的 NOT: { field: value } 不會匹配 NULL（從沒產生過的新設定），
  // 必須明確把 null 列進來，否則新設定永遠不會第一次觸發
  const notGeneratedThisMonth = {
    OR: [{ lastGeneratedYearMonth: null }, { NOT: { lastGeneratedYearMonth: yearMonth } }],
  };

  const [dueExpenses, dueIncomes, dueReceivables] = await Promise.all([
    prisma.recurringExpense.findMany({
      where: { active: true, dayOfMonth: { lte: today }, ...notGeneratedThisMonth },
    }),
    prisma.recurringIncome.findMany({
      where: { active: true, dayOfMonth: { lte: today }, ...notGeneratedThisMonth },
    }),
    prisma.recurringReceivable.findMany({
      where: { active: true, dayOfMonth: { lte: today }, ...notGeneratedThisMonth },
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

  for (const r of dueReceivables) {
    try {
      const generated = buildGeneratedReceivable(
        { title: r.title, dueInDays: r.dueInDays },
        occurredAt,
        yearMonth
      );
      await prisma.$transaction([
        prisma.receivable.create({
          data: {
            userId: r.userId,
            clientId: r.clientId,
            title: generated.title,
            kind: "RECURRING",
            amount: r.amount,
            dueDate: generated.dueDate,
          },
        }),
        prisma.recurringReceivable.update({
          where: { id: r.id },
          data: { lastGeneratedYearMonth: yearMonth },
        }),
      ]);
      created += 1;
    } catch (err) {
      console.error(`定期請款建立失敗 (id=${r.id}):`, err);
      errors.push(r.id);
    }
  }

  return Response.json({
    checkedExpenses: dueExpenses.length,
    checkedIncomes: dueIncomes.length,
    checkedReceivables: dueReceivables.length,
    created,
    errors: errors.length > 0 ? errors : undefined,
  });
}
