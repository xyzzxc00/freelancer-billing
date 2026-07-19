"use client";

import { useMemo, useState } from "react";
import { calculateTax } from "@/lib/tax";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function LaborIncomeCalculator() {
  const [amount, setAmount] = useState("30000");

  const subtotal = Math.max(0, Math.round(Number(amount) || 0));
  const breakdown = useMemo(() => calculateTax(subtotal, "LABOR_INCOME_10PCT"), [subtotal]);
  const noDeduction = breakdown.freelancerLines.length === 1;

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="mb-4">
        <label className="text-sm text-foreground-muted block mb-1">單筆勞務報酬金額</label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full sm:max-w-xs font-mono"
        />
      </div>

      <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm">
        {breakdown.freelancerLines.map((line) => (
          <div key={line.label} className="flex justify-between text-foreground-muted">
            <span>{line.label}</span>
            <span className="font-mono">{currency.format(line.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
          <span>實拿金額</span>
          <span className="font-mono">{currency.format(breakdown.freelancerNet)}</span>
        </div>
      </div>

      {noDeduction && subtotal > 0 && (
        <p className="text-xs text-foreground-muted mt-3">
          未達 2 萬元起扣點，這筆不會被扣二代健保或所得稅，全額實拿。
        </p>
      )}
    </div>
  );
}
