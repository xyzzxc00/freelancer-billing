// 年度綜所稅試算（民國 115 年度＝2026 年所得，2027 年 5 月申報適用）
// 參數來源：財政部 2025-11 公告之 115 年度免稅額、扣除額與課稅級距
// （與 114 年度相同：免稅額 101,000、標準扣除 136,000、級距 61 萬起跳）
// 更新時機：財政部每年 11-12 月公告次年度金額，若有調整需同步改這裡

export const TAX_YEAR_LABEL = "115 年度（2026 年所得）";

export const EXEMPTION = 101_000; // 免稅額（本人）
export const STANDARD_DEDUCTION_SINGLE = 136_000; // 標準扣除額（單身）
export const SALARY_SPECIAL_DEDUCTION = 227_000; // 薪資所得特別扣除額
export const MANUSCRIPT_EXEMPTION = 180_000; // 9B 稿費類全年免稅額度
export const MANUSCRIPT_EXPENSE_RATE = 0.3; // 9B 超過免稅額度部分的費用率

// 課稅級距（速算扣除額法：稅額 = 淨額 × 稅率 − 累進差額）
export const TAX_BRACKETS = [
  { upTo: 610_000, rate: 0.05, quickDeduction: 0 },
  { upTo: 1_380_000, rate: 0.12, quickDeduction: 42_700 },
  { upTo: 2_770_000, rate: 0.2, quickDeduction: 153_100 },
  { upTo: 5_190_000, rate: 0.3, quickDeduction: 430_100 },
  { upTo: Infinity, rate: 0.4, quickDeduction: 949_100 },
] as const;

export type FreelanceIncomeType = "9A" | "9B" | "SALARY";

export const incomeTypeLabel: Record<FreelanceIncomeType, string> = {
  "9A": "執行業務所得（9A）",
  "9B": "稿費、講演、版稅類（9B）",
  SALARY: "薪資所得（50）",
};

export interface TaxEstimate {
  grossIncome: number;
  deductedIncome: number; // 扣掉費用率／免稅額度／薪資特別扣除後的所得額
  netTaxable: number; // 再減免稅額與標準扣除額後的課稅淨額
  bracketRate: number; // 適用的最高級距稅率
  tax: number; // 估算應納稅額
}

/**
 * 用「單身、標準扣除、只有這筆接案所得」的最簡假設估算全年綜所稅。
 * 9A 依費用率減除、9B 先扣 18 萬免稅額度再減 30% 費用、薪資扣薪資特別扣除額。
 */
export function estimateAnnualTax({
  grossIncome,
  incomeType,
  expenseRate = 0.3,
}: {
  grossIncome: number;
  incomeType: FreelanceIncomeType;
  expenseRate?: number; // 只在 9A 使用，0-1
}): TaxEstimate {
  let deductedIncome: number;
  if (incomeType === "9B") {
    const overExemption = Math.max(0, grossIncome - MANUSCRIPT_EXEMPTION);
    deductedIncome = Math.round(overExemption * (1 - MANUSCRIPT_EXPENSE_RATE));
  } else if (incomeType === "SALARY") {
    deductedIncome = Math.max(0, grossIncome - SALARY_SPECIAL_DEDUCTION);
  } else {
    deductedIncome = Math.round(grossIncome * (1 - expenseRate));
  }

  const netTaxable = Math.max(0, deductedIncome - EXEMPTION - STANDARD_DEDUCTION_SINGLE);

  const bracket = TAX_BRACKETS.find((b) => netTaxable <= b.upTo) ?? TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const tax = Math.max(0, Math.round(netTaxable * bracket.rate - bracket.quickDeduction));

  return {
    grossIncome,
    deductedIncome,
    netTaxable,
    bracketRate: netTaxable > 0 ? bracket.rate : 0,
    tax,
  };
}
