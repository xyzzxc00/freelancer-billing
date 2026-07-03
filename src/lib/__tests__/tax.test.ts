import { describe, it, expect } from "vitest";
import { calculateTax, type TaxMode } from "../tax";

describe("calculateTax", () => {
  it("NONE 模式：客戶應付與實拿都等於小計", () => {
    const r = calculateTax(10000, "NONE");
    expect(r.clientTotal).toBe(10000);
    expect(r.freelancerNet).toBe(10000);
  });

  it("BUSINESS_5PCT：營業稅四捨五入到整數元", () => {
    // 33333 × 5% = 1666.65 → 1667
    const r = calculateTax(33333, "BUSINESS_5PCT");
    expect(r.clientTotal).toBe(33333 + 1667);
    expect(r.freelancerNet).toBe(33333);
  });

  it("LABOR_INCOME_10PCT：單筆 2 萬（含）以下免扣繳，代扣稅和二代健保都不收", () => {
    const r = calculateTax(20000, "LABOR_INCOME_10PCT");
    expect(r.clientTotal).toBe(20000);
    expect(r.freelancerNet).toBe(20000);
    expect(r.freelancerLines).toHaveLength(1); // 只有總額，無代扣、無健保
  });

  it("LABOR_INCOME_10PCT：單筆遠低於 2 萬，完全免扣繳", () => {
    const r = calculateTax(15000, "LABOR_INCOME_10PCT");
    expect(r.freelancerNet).toBe(15000);
    expect(r.freelancerLines).toHaveLength(1);
  });

  it("LABOR_INCOME_10PCT：超過 2 萬收二代健保且四捨五入", () => {
    // 代扣 2500；健保 25000 × 2.11% = 527.5 → 528
    const r = calculateTax(25000, "LABOR_INCOME_10PCT");
    expect(r.freelancerNet).toBe(25000 - 2500 - 528);
    expect(r.freelancerLines).toHaveLength(3);
  });

  it("任何模式與金額下，明細各行加總都等於總額", () => {
    const modes: TaxMode[] = ["NONE", "BUSINESS_5PCT", "LABOR_INCOME_10PCT"];
    for (const subtotal of [1, 999, 19999, 20001, 33333, 87654, 1234567]) {
      for (const mode of modes) {
        const r = calculateTax(subtotal, mode);
        const clientSum = r.clientLines.reduce((s, l) => s + l.amount, 0);
        const freelancerSum = r.freelancerLines.reduce((s, l) => s + l.amount, 0);
        expect(clientSum).toBe(r.clientTotal);
        expect(freelancerSum).toBe(r.freelancerNet);
      }
    }
  });
});
