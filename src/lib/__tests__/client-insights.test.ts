import { describe, it, expect } from "vitest";
import { buildPaymentPunctuality } from "../client-insights";

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

describe("buildPaymentPunctuality", () => {
  it("沒有紀錄時回傳 count 0、avgDaysLate null", () => {
    expect(buildPaymentPunctuality([])).toEqual({
      count: 0,
      onTimeCount: 0,
      lateCount: 0,
      avgDaysLate: null,
    });
  });

  it("全部準時（含當天付清）算 onTime，不算 late", () => {
    const result = buildPaymentPunctuality([
      { dueDate: utcDate(2026, 6, 10), paidAt: utcDate(2026, 6, 8) },
      { dueDate: utcDate(2026, 6, 10), paidAt: utcDate(2026, 6, 10) },
    ]);
    expect(result).toEqual({
      count: 2,
      onTimeCount: 2,
      lateCount: 0,
      avgDaysLate: -1,
    });
  });

  it("全部逾期，avgDaysLate 為正數", () => {
    const result = buildPaymentPunctuality([
      { dueDate: utcDate(2026, 6, 1), paidAt: utcDate(2026, 6, 6) },
      { dueDate: utcDate(2026, 6, 1), paidAt: utcDate(2026, 6, 11) },
    ]);
    expect(result).toEqual({
      count: 2,
      onTimeCount: 0,
      lateCount: 2,
      avgDaysLate: 8,
    });
  });

  it("混合準時與逾期，各自計數正確", () => {
    const result = buildPaymentPunctuality([
      { dueDate: utcDate(2026, 6, 1), paidAt: utcDate(2026, 6, 1) }, // 準時
      { dueDate: utcDate(2026, 6, 1), paidAt: utcDate(2026, 6, 4) }, // 晚 3 天
      { dueDate: utcDate(2026, 6, 1), paidAt: utcDate(2026, 5, 29) }, // 提前 2 天
    ]);
    expect(result.count).toBe(3);
    expect(result.onTimeCount).toBe(2);
    expect(result.lateCount).toBe(1);
    expect(result.avgDaysLate).toBe(0); // (0 + 3 - 2) / 3 = 0.33 → 四捨五入 0
  });

  it("單筆提前付款，avgDaysLate 為負數", () => {
    const result = buildPaymentPunctuality([
      { dueDate: utcDate(2026, 6, 10), paidAt: utcDate(2026, 6, 5) },
    ]);
    expect(result.avgDaysLate).toBe(-5);
    expect(result.onTimeCount).toBe(1);
    expect(result.lateCount).toBe(0);
  });
});
