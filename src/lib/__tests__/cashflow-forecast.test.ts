import { describe, it, expect } from "vitest";
import { buildCashFlowForecast } from "../cashflow-forecast";

// now 一律用 UTC 表示台灣「今天」的年月（比照 taipeiNow() 的用法）
function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

describe("buildCashFlowForecast", () => {
  it("待收款依到期日分配到對應月份的桶子", () => {
    const now = utcDate(2026, 6, 15); // 2026-07-15，本月是 7 月（month index 6）
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [
        { amount: 1000, dueDate: utcDate(2026, 6, 20) }, // 本月
        { amount: 2000, dueDate: utcDate(2026, 7, 5) }, // 下個月
        { amount: 3000, dueDate: utcDate(2026, 8, 1) }, // 下下個月
      ],
      recurringIncomeTotal: 0,
      recurringExpenseTotal: 0,
    });

    expect(forecast).toHaveLength(3);
    expect(forecast[0]).toMatchObject({ year: 2026, month: 6, knownIn: 1000 });
    expect(forecast[1]).toMatchObject({ year: 2026, month: 7, knownIn: 2000 });
    expect(forecast[2]).toMatchObject({ year: 2026, month: 8, knownIn: 3000 });
  });

  it("逾期的待收款（到期日在本月之前）歸到第一個桶子，不會被丟掉或產生負數索引", () => {
    const now = utcDate(2026, 6, 15);
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [{ amount: 500, dueDate: utcDate(2026, 3, 1) }], // 3 個月前逾期
      recurringIncomeTotal: 0,
      recurringExpenseTotal: 0,
    });

    expect(forecast[0].knownIn).toBe(500);
  });

  it("超過預測範圍的到期日歸到最後一個桶子，不會被丟掉或超出陣列", () => {
    const now = utcDate(2026, 6, 15);
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [{ amount: 700, dueDate: utcDate(2027, 0, 1) }], // 半年後
      recurringIncomeTotal: 0,
      recurringExpenseTotal: 0,
    });

    expect(forecast[2].knownIn).toBe(700);
  });

  it("跨年份邊界（12 月往後推）月份與年份都要正確進位", () => {
    const now = utcDate(2026, 11, 10); // 2026-12-10
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [],
      recurringIncomeTotal: 0,
      recurringExpenseTotal: 0,
    });

    expect(forecast.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-11", // 12 月
      "2027-0", // 隔年 1 月
      "2027-1", // 隔年 2 月
    ]);
  });

  it("定期收支每個月都會計入，且與待收款加總正確", () => {
    const now = utcDate(2026, 6, 15);
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [{ amount: 1000, dueDate: utcDate(2026, 6, 20) }],
      recurringIncomeTotal: 5000,
      recurringExpenseTotal: 2000,
    });

    expect(forecast[0]).toMatchObject({ knownIn: 6000, knownOut: 2000, net: 4000 });
    // 沒有待收款的月份也要有定期收支
    expect(forecast[1]).toMatchObject({ knownIn: 5000, knownOut: 2000, net: 3000 });
  });

  it("完全沒有資料時回傳全零的月份陣列", () => {
    const now = utcDate(2026, 6, 15);
    const forecast = buildCashFlowForecast({
      now,
      pendingReceivables: [],
      recurringIncomeTotal: 0,
      recurringExpenseTotal: 0,
    });

    expect(forecast).toHaveLength(3);
    expect(forecast.every((m) => m.knownIn === 0 && m.knownOut === 0 && m.net === 0)).toBe(true);
  });
});
