"use client";

import { useMemo, useState } from "react";
import {
  estimateAnnualTax,
  incomeTypeLabel,
  TAX_YEAR_LABEL,
  EXEMPTION,
  STANDARD_DEDUCTION_SINGLE,
  type FreelanceIncomeType,
} from "@/lib/tax-estimate";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function TaxEstimator({ defaultGross }: { defaultGross: number }) {
  const [gross, setGross] = useState(String(Math.round(defaultGross) || ""));
  const [incomeType, setIncomeType] = useState<FreelanceIncomeType>("9A");
  const [expenseRatePct, setExpenseRatePct] = useState("30");

  const estimate = useMemo(() => {
    const grossIncome = Math.max(0, Number(gross) || 0);
    const rate = Math.min(100, Math.max(0, Number(expenseRatePct) || 0)) / 100;
    return estimateAnnualTax({ grossIncome, incomeType, expenseRate: rate });
  }, [gross, incomeType, expenseRatePct]);

  return (
    <div className="border border-border rounded-lg p-4">
      <h2 className="text-base font-medium mb-1">年度所得稅試算</h2>
      <p className="text-xs text-foreground-muted mb-4">
        用 {TAX_YEAR_LABEL} 的免稅額與級距，以「單身、標準扣除額、只有這筆接案所得」的最簡情境估算，實際稅額依個人申報情況而定。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-sm text-foreground-muted block mb-1">年度接案總收入</label>
          <input
            type="number"
            min="0"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
          />
        </div>
        <div>
          <label className="text-sm text-foreground-muted block mb-1">所得申報類別</label>
          <select
            value={incomeType}
            onChange={(e) => setIncomeType(e.target.value as FreelanceIncomeType)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
          >
            {(Object.keys(incomeTypeLabel) as FreelanceIncomeType[]).map((t) => (
              <option key={t} value={t}>
                {incomeTypeLabel[t]}
              </option>
            ))}
          </select>
        </div>
        {incomeType === "9A" && (
          <div>
            <label className="text-sm text-foreground-muted block mb-1">費用率（%）</label>
            <input
              type="number"
              min="0"
              max="100"
              value={expenseRatePct}
              onChange={(e) => setExpenseRatePct(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
            />
            <p className="text-xs text-foreground-muted mt-1">
              依職業別不同（財政部每年公布費用標準），多數自由工作者適用 30%。
            </p>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between text-foreground-muted">
          <span>
            {incomeType === "9A" && "減除費用後所得"}
            {incomeType === "9B" && "減 18 萬免稅額度與 30% 費用後所得"}
            {incomeType === "SALARY" && "減薪資特別扣除額後所得"}
          </span>
          <span className="font-mono">{currency.format(estimate.deductedIncome)}</span>
        </div>
        <div className="flex justify-between text-foreground-muted">
          <span>
            減免稅額 {currency.format(EXEMPTION)} 與標準扣除額 {currency.format(STANDARD_DEDUCTION_SINGLE)}
          </span>
          <span className="font-mono">{currency.format(estimate.netTaxable)}</span>
        </div>
        <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
          <span>
            估算應納稅額
            {estimate.bracketRate > 0 && (
              <span className="text-xs text-foreground-muted font-normal ml-1.5">
                適用 {Math.round(estimate.bracketRate * 100)}% 級距
              </span>
            )}
          </span>
          <span className="font-mono">{currency.format(estimate.tax)}</span>
        </div>
      </div>

      <p className="text-xs text-foreground-muted mt-3">
        提醒：單筆勞務報酬達 2 萬元時，給付方會代扣 10% 所得稅與 2.11% 二代健保補充保費，代扣的所得稅可以在申報時抵減。此試算僅供參考，正式申報請以國稅局資料為準。
      </p>
    </div>
  );
}
