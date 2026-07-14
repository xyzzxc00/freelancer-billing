import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { currency, formatDate } from "@/lib/currency";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 50;

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; page?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam, month: monthParam, page: pageParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) : null;
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeStart = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const rangeEnd = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);

  const where = {
    userId,
    type: "INCOME" as const,
    occurredAt: { gte: rangeStart, lt: rangeEnd },
  };

  // 統計交給 DB groupBy，避免撈整年明細回來只為了加總
  const [statsGroups, categories, totalCount, income, activeRecurring] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["incomeCategoryId", "category"],
      where,
      _sum: { amount: true },
    }),
    prisma.incomeCategory.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { incomeCategory: true },
    }),
    prisma.recurringIncome.findMany({
      where: { userId, active: true },
      orderBy: { dayOfMonth: "asc" },
    }),
  ]);
  const recurringMonthlyTotal = activeRecurring.reduce((sum, r) => sum + Number(r.amount), 0);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  let total = 0;
  const bySource = new Map<string, number>();
  for (const g of statsGroups) {
    const amount = Number(g._sum.amount ?? 0);
    total += amount;
    const label =
      (g.incomeCategoryId ? categoryNames.get(g.incomeCategoryId) : undefined) ??
      g.category ??
      "未分類";
    bySource.set(label, (bySource.get(label) ?? 0) + amount);
  }
  const sourceRows = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.set("month", String(month));
    if (p > 1) params.set("page", String(p));
    return `/income?${params}`;
  };

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium">收入</h1>
          <div className="flex gap-2 text-sm">
            <Link
              href={`/income?year=${year - 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year - 1}
            </Link>
            <span className="font-medium">{year}</span>
            <Link
              href={`/income?year=${year + 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year + 1}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/income/categories"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            分類管理
          </Link>
          <Link
            href="/income/recurring"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            定期收入
          </Link>
          <Link href="/income/new" className="text-sm text-accent hover:underline">
            + 新增收入
          </Link>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <Link
          href={`/income?year=${year}`}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !month ? "bg-accent text-accent-foreground border-accent" : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          全年
        </Link>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Link
            key={m}
            href={`/income?year=${year}&month=${m}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              month === m ? "bg-accent text-accent-foreground border-accent" : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            {m} 月
          </Link>
        ))}
      </div>

      <div className="bg-surface rounded-lg p-4 mb-7">
        <p className="text-sm text-foreground-muted mb-1.5">
          {month ? `${year} 年 ${month} 月收入` : `${year} 年總收入`}
        </p>
        <p className="text-2xl font-medium">{currency.format(total)}</p>
      </div>

      {activeRecurring.length > 0 && (
        <div className="bg-surface rounded-lg p-4 mb-7">
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="text-sm font-medium">
              定期收入（每月合計 {currency.format(recurringMonthlyTotal)}）
            </p>
            <Link href="/income/recurring" className="text-xs text-foreground-muted hover:text-foreground">
              管理 →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {activeRecurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted truncate">
                  {r.name} · 每月 {r.dayOfMonth} 號
                </span>
                <span className="font-mono shrink-0 ml-2">{currency.format(Number(r.amount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-base font-medium mb-3">來源佔比</h2>
      {sourceRows.length === 0 ? (
        <p className="text-sm text-foreground-muted mb-7">這一年還沒有收入記錄。</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden mb-7">
          {sourceRows.map(([label, amount]) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-border last:border-b-0"
            >
              <span>{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-muted">
                  {total > 0 ? Math.round((amount / total) * 100) : 0}%
                </span>
                <span className="font-mono">{currency.format(amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-base font-medium mb-3">明細</h2>
      {income.length === 0 ? (
        <p className="text-sm text-foreground-muted">這一年還沒有收入記錄。</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {income.map((i) => (
              <Link
                key={i.id}
                href={`/income/${i.id}`}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {i.incomeCategory?.name ?? i.category ?? "未分類"}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5 truncate">
                    {formatDate(i.occurredAt)}
                    {i.note ? ` · ${i.note}` : ""}
                  </p>
                </div>
                <span className="text-sm font-mono shrink-0">+{currency.format(Number(i.amount))}</span>
              </Link>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}
