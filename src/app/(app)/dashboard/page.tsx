import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已送出",
  ACCEPTED: "已接受",
  REJECTED: "已拒絕",
};

const statusTone: Record<string, string> = {
  DRAFT: "bg-surface text-foreground-muted",
  SENT: "bg-warning-bg text-warning-fg",
  ACCEPTED: "bg-success-bg text-success-fg",
  REJECTED: "bg-danger-bg text-danger-fg",
};

const avatarTones = [
  "bg-[#FAECE7] text-[#712B13]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#FAEEDA] text-[#633806]",
  "bg-[#FBEAF0] text-[#72243E]",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam } = await searchParams;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [paidThisMonth, receivables, recentQuotes, clients, yearTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        occurredAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.receivable.findMany({
      where: { userId, status: "PENDING" },
      select: { amount: true, dueDate: true },
    }),
    prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { client: true, items: true },
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { quotes: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: yearStart, lt: yearEnd } },
      select: { type: true, amount: true, occurredAt: true },
    }),
  ]);

  const pendingTotal = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const overdueTotal = receivables
    .filter((r) => r.dueDate && r.dueDate < now)
    .reduce((sum, r) => sum + Number(r.amount), 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-surface rounded-lg p-4">
            <p className="text-sm text-foreground-muted mb-1.5">本月已收款</p>
            <p className="text-2xl font-medium">
              {currency.format(Number(paidThisMonth._sum.amount ?? 0))}
            </p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <p className="text-sm text-foreground-muted mb-1.5">待收款</p>
            <p className="text-2xl font-medium text-[color:var(--warning-fg)]">
              {currency.format(pendingTotal)}
            </p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <p className="text-sm text-foreground-muted mb-1.5">逾期未收</p>
            <p className="text-2xl font-medium text-[color:var(--danger-fg)]">
              {currency.format(overdueTotal)}
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="text-lg font-medium">近期報價單</h2>
          <Link href="/quotes/new" className="text-sm text-accent hover:underline">
            + 新增報價單
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <p className="text-sm text-foreground-muted mb-7">還沒有報價單。</p>
        ) : (
          <div className="flex flex-col gap-2 mb-7">
            {recentQuotes.map((quote) => {
              const total = quote.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="bg-background border border-border rounded-lg px-4.5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {quote.client.name} — {quote.title}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {new Date(quote.createdAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-medium font-mono">
                      {currency.format(total)}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full ${statusTone[quote.status]}`}
                    >
                      {statusLabel[quote.status]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="text-lg font-medium">客戶</h2>
          <Link href="/clients" className="text-sm text-foreground-muted hover:text-foreground">
            查看全部
          </Link>
        </div>

        {clients.length === 0 ? (
          <p className="text-sm text-foreground-muted mb-7">還沒有客戶資料。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
            {clients.map((client, i) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="border border-border rounded-lg p-3.5 text-center hover:bg-surface transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2 ${avatarTones[i % avatarTones.length]}`}
                >
                  {client.name.slice(0, 1)}
                </div>
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {client._count.quotes} 個案件
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">年度收支彙整</h2>
            <div className="flex gap-2 text-sm">
              <Link
                href={`/dashboard?year=${year - 1}`}
                className="text-foreground-muted hover:text-foreground"
              >
                {year - 1}
              </Link>
              <span className="font-medium">{year}</span>
              <Link
                href={`/dashboard?year=${year + 1}`}
                className="text-foreground-muted hover:text-foreground"
              >
                {year + 1}
              </Link>
            </div>
          </div>
          <a
            href={`/dashboard/export?year=${year}`}
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

        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]" style={{ tableLayout: "fixed" }}>
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
