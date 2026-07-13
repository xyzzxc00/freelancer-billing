export interface ReceivableForForecast {
  amount: number;
  dueDate: Date;
}

export interface MonthForecast {
  year: number;
  month: number; // 0-indexed
  knownIn: number;
  knownOut: number;
  net: number;
}

/**
 * 把待收款依到期日分配到未來 monthCount 個月的桶子裡（早於本月或晚於預測範圍的都夾到最近的邊界），
 * 再加上固定每月發生一次的定期收支，算出每個月「已知」的收支淨額。
 */
export function buildCashFlowForecast({
  now,
  monthCount = 3,
  pendingReceivables,
  recurringIncomeTotal,
  recurringExpenseTotal,
}: {
  now: Date; // 已平移到台灣時區的 Date，一律用 getUTC* 系列方法讀取
  monthCount?: number;
  pendingReceivables: ReceivableForForecast[];
  recurringIncomeTotal: number;
  recurringExpenseTotal: number;
}): MonthForecast[] {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const months = Array.from({ length: monthCount }, (_, i) => {
    const totalMonth = currentMonth + i;
    return {
      year: currentYear + Math.floor(totalMonth / 12),
      month: totalMonth % 12,
      receivablesIn: 0,
    };
  });

  for (const r of pendingReceivables) {
    const offset =
      (r.dueDate.getUTCFullYear() - currentYear) * 12 + (r.dueDate.getUTCMonth() - currentMonth);
    const idx = Math.max(0, Math.min(monthCount - 1, offset));
    months[idx].receivablesIn += r.amount;
  }

  return months.map((m) => {
    const knownIn = m.receivablesIn + recurringIncomeTotal;
    const knownOut = recurringExpenseTotal;
    return { year: m.year, month: m.month, knownIn, knownOut, net: knownIn - knownOut };
  });
}
