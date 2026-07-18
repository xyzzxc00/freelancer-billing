import { describe, it, expect } from "vitest";
import { estimateAnnualTax } from "../tax-estimate";

describe("estimateAnnualTax", () => {
  it("9A 依費用率減除後再扣免稅額與標準扣除額", () => {
    // 100 萬 × 70% = 70 萬 − 101,000 − 136,000 = 463,000 → 5% = 23,150
    const r = estimateAnnualTax({ grossIncome: 1_000_000, incomeType: "9A", expenseRate: 0.3 });
    expect(r.deductedIncome).toBe(700_000);
    expect(r.netTaxable).toBe(463_000);
    expect(r.bracketRate).toBe(0.05);
    expect(r.tax).toBe(23_150);
  });

  it("課稅淨額超過 61 萬適用 12% 並減累進差額", () => {
    // 150 萬 × 70% = 105 萬 − 237,000 = 813,000 → ×12% − 42,700 = 54,860
    const r = estimateAnnualTax({ grossIncome: 1_500_000, incomeType: "9A", expenseRate: 0.3 });
    expect(r.netTaxable).toBe(813_000);
    expect(r.bracketRate).toBe(0.12);
    expect(r.tax).toBe(54_860);
  });

  it("9B 全年 18 萬內免稅，稅額為 0", () => {
    const r = estimateAnnualTax({ grossIncome: 180_000, incomeType: "9B" });
    expect(r.deductedIncome).toBe(0);
    expect(r.tax).toBe(0);
  });

  it("9B 超過 18 萬的部分先減 30% 費用再課稅", () => {
    // (68 萬 − 18 萬) × 70% = 35 萬 − 237,000 = 113,000 → 5% = 5,650
    const r = estimateAnnualTax({ grossIncome: 680_000, incomeType: "9B" });
    expect(r.deductedIncome).toBe(350_000);
    expect(r.netTaxable).toBe(113_000);
    expect(r.tax).toBe(5_650);
  });

  it("薪資型扣薪資特別扣除額", () => {
    // 80 萬 − 227,000 = 573,000 − 237,000 = 336,000 → 5% = 16,800
    const r = estimateAnnualTax({ grossIncome: 800_000, incomeType: "SALARY" });
    expect(r.deductedIncome).toBe(573_000);
    expect(r.netTaxable).toBe(336_000);
    expect(r.tax).toBe(16_800);
  });

  it("收入低於門檻時課稅淨額與稅額都是 0，不會出現負數", () => {
    const r = estimateAnnualTax({ grossIncome: 200_000, incomeType: "9A", expenseRate: 0.3 });
    expect(r.netTaxable).toBe(0);
    expect(r.tax).toBe(0);
    expect(r.bracketRate).toBe(0);
  });

  it("高所得適用 40% 級距", () => {
    // 1,000 萬 × 100%（費用率 0）− 237,000 = 9,763,000 → ×40% − 949,100 = 2,956,100
    const r = estimateAnnualTax({ grossIncome: 10_000_000, incomeType: "9A", expenseRate: 0 });
    expect(r.bracketRate).toBe(0.4);
    expect(r.tax).toBe(2_956_100);
  });
});
