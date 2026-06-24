import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const yearTransactions = await prisma.transaction.findMany({
    where: { userId, occurredAt: { gte: yearStart, lt: yearEnd } },
    select: { type: true, amount: true, occurredAt: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  for (const t of yearTransactions) {
    const m = t.occurredAt.getMonth();
    if (t.type === "INCOME") monthly[m].income += Number(t.amount);
    else monthly[m].expense += Number(t.amount);
  }
  const yearIncome = monthly.reduce((sum, m) => sum + m.income, 0);
  const yearExpense = monthly.reduce((sum, m) => sum + m.expense, 0);

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

      <h2 className="text-base font-medium mb-3">月度彙整</h2>

      {/* 手機：卡片 */}
      <div className="sm:hidden flex flex-col gap-2">
        {monthly.map((m) => {
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
        {monthly.every((m) => m.income === 0 && m.expense === 0) && (
          <p className="text-sm text-foreground-muted">這一年還沒有收支記錄。</p>
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
            {monthly.map((m) => (
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
