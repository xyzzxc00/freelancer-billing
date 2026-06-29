import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ReportsBarChart } from "@/components/ReportsBarChart";

import { currency } from "@/lib/currency";

const quarters = [
  { label: "Q1", from: 1, to: 3 },
  { label: "Q2", from: 4, to: 6 },
  { label: "Q3", from: 7, to: 9 },
  { label: "Q4", from: 10, to: 12 },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; from?: string; to?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam, from: fromParam, to: toParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const fromMonth = fromParam ? Math.max(1, Math.min(12, Number(fromParam))) : 1;
  const toMonth = toParam ? Math.max(1, Math.min(12, Number(toParam))) : 12;

  const rangeStart = new Date(year, fromMonth - 1, 1);
  const rangeEnd = new Date(year, toMonth, 1);

  const yearTransactions = await prisma.transaction.findMany({
    where: { userId, occurredAt: { gte: rangeStart, lt: rangeEnd } },
    select: { type: true, amount: true, occurredAt: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  for (const t of yearTransactions) {
    const m = t.occurredAt.getMonth();
    if (t.type === "INCOME") monthly[m].income += Number(t.amount);
    else monthly[m].expense += Number(t.amount);
  }
  const filtered = monthly.filter((m) => m.month >= fromMonth && m.month <= toMonth);
  const yearIncome = filtered.reduce((sum, m) => sum + m.income, 0);
  const yearExpense = filtered.reduce((sum, m) => sum + m.expense, 0);

  function quarterHref(q: { from: number; to: number }) {
    const p = new URLSearchParams({ year: String(year), from: String(q.from), to: String(q.to) });
    return `/reports?${p}`;
  }
  const isFullYear = fromMonth === 1 && toMonth === 12;

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium">收支報表</h1>
          <div className="flex gap-2 text-sm">
            <Link
              href={`/reports?year=${year - 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year - 1}
            </Link>
            <span className="font-medium">{year}</span>
            <Link
              href={`/reports?year=${year + 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year + 1}
            </Link>
          </div>
        </div>
        <a
          href={`/reports/export?year=${year}`}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          匯出 CSV
        </a>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <Link
          href={`/reports?year=${year}`}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            isFullYear
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          全年
        </Link>
        {quarters.map((q) => {
          const active = fromMonth === q.from && toMonth === q.to;
          return (
            <Link
              key={q.label}
              href={quarterHref(q)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {q.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        <div className="bg-surface rounded-lg p-4">
          <p className="text-sm text-foreground-muted mb-1.5">{year} 年總收入</p>
          <p className="text-2xl font-medium">{currency.format(yearIncome)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <p className="text-sm text-foreground-muted mb-1.5">{year} 年總支出</p>
          <p className="text-2xl font-medium">{currency.format(yearExpense)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <p className="text-sm text-foreground-muted mb-1.5">{year} 年淨收入</p>
          <p className="text-2xl font-medium">{currency.format(yearIncome - yearExpense)}</p>
        </div>
      </div>

      <ReportsBarChart data={filtered} />

      <h2 className="text-base font-medium mb-3">月度彙整</h2>

      {/* 手機：卡片 */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.map((m) => {
          const net = m.income - m.expense;
          if (m.income === 0 && m.expense === 0) return null;
          return (
            <div key={m.month} className="border border-border rounded-lg px-4 py-3">
              <p className="text-sm font-medium mb-2">{m.month} 月</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-foreground-muted mb-0.5">收入</p>
                  <p className="font-mono">{currency.format(m.income)}</p>
                </div>
                <div>
                  <p className="text-foreground-muted mb-0.5">支出</p>
                  <p className="font-mono">{currency.format(m.expense)}</p>
                </div>
                <div>
                  <p className="text-foreground-muted mb-0.5">淨收入</p>
                  <p className={`font-mono ${net < 0 ? "text-[color:var(--danger-fg)]" : ""}`}>
                    {currency.format(net)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.every((m) => m.income === 0 && m.expense === 0) && (
          <p className="text-sm text-foreground-muted">這個區間還沒有收支記錄。</p>
        )}
      </div>

      {/* 桌機：表格 */}
      <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="bg-surface text-foreground-muted text-xs">
              <th className="text-left px-3 py-2 w-16">月份</th>
              <th className="text-right px-3 py-2">收入</th>
              <th className="text-right px-3 py-2">支出</th>
              <th className="text-right px-3 py-2">淨收入</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.month} className="border-t border-border">
                <td className="px-3 py-2">{m.month} 月</td>
                <td className="text-right px-3 py-2 font-mono">{currency.format(m.income)}</td>
                <td className="text-right px-3 py-2 font-mono">{currency.format(m.expense)}</td>
                <td className="text-right px-3 py-2 font-mono">
                  {currency.format(m.income - m.expense)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
