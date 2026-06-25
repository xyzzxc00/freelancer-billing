"use client";

interface MonthData {
  month: number;
  income: number;
  expense: number;
}

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function ReportsBarChart({ data }: { data: MonthData[] }) {
  const nonEmpty = data.filter((m) => m.income > 0 || m.expense > 0);
  if (nonEmpty.length === 0) return null;

  const max = Math.max(...data.map((m) => Math.max(m.income, m.expense)), 1);
  const BAR_H = 120;

  return (
    <div className="border border-border rounded-lg p-4 mb-7 overflow-x-auto">
      <div className="flex gap-3 mb-2 text-xs text-foreground-muted">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[color:var(--success-fg)] opacity-70 inline-block" />
          收入
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[color:var(--danger-fg)] opacity-60 inline-block" />
          支出
        </span>
      </div>
      <div className="flex items-end gap-1 min-w-0" style={{ height: BAR_H + 28 }}>
        {data.map((m) => {
          const incomeH = Math.round((m.income / max) * BAR_H);
          const expenseH = Math.round((m.expense / max) * BAR_H);
          const isEmpty = m.income === 0 && m.expense === 0;
          return (
            <div key={m.month} className="flex flex-col items-center gap-0.5 flex-1 min-w-[22px] group relative">
              {!isEmpty && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-surface border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-sm">
                    <div className="text-[color:var(--success-fg)]">+{currency.format(m.income)}</div>
                    <div className="text-[color:var(--danger-fg)]">-{currency.format(m.expense)}</div>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-px w-full" style={{ height: BAR_H }}>
                <div
                  className="flex-1 rounded-t-sm bg-[color:var(--success-fg)] opacity-70 transition-all"
                  style={{ height: incomeH || (isEmpty ? 0 : 2) }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-[color:var(--danger-fg)] opacity-60 transition-all"
                  style={{ height: expenseH || (isEmpty ? 0 : 2) }}
                />
              </div>
              <span className="text-[10px] text-foreground-muted leading-none">{m.month}月</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
