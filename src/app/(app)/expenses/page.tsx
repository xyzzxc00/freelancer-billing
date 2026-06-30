import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { currency, formatDate } from "@/lib/currency";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 50;

export default async function ExpensesPage({
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
    type: "EXPENSE" as const,
    occurredAt: { gte: rangeStart, lt: rangeEnd },
  };

  // 統計用的全年/全月資料只取必要欄位，避免一次撈整批完整紀錄
  const [allForStats, totalCount, expenses] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: { amount: true, category: true, expenseCategory: { select: { name: true } } },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { expenseCategory: true },
    }),
  ]);

  const total = allForStats.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = new Map<string, number>();
  for (const e of allForStats) {
    const label = e.expenseCategory?.name ?? e.category ?? "未分類";
    byCategory.set(label, (byCategory.get(label) ?? 0) + Number(e.amount));
  }
  const categoryRows = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.set("month", String(month));
    if (p > 1) params.set("page", String(p));
    return `/expenses?${params}`;
  };

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium">支出</h1>
          <div className="flex gap-2 text-sm">
            <Link
              href={`/expenses?year=${year - 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year - 1}
            </Link>
            <span className="font-medium">{year}</span>
            <Link
              href={`/expenses?year=${year + 1}`}
              className="text-foreground-muted hover:text-foreground"
            >
              {year + 1}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/expenses/categories"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            分類管理
          </Link>
          <Link
            href="/expenses/recurring"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            定期支出
          </Link>
          <Link href="/expenses/new" className="text-sm text-accent hover:underline">
            + 新增支出
          </Link>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <Link
          href={`/expenses?year=${year}`}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !month ? "bg-accent text-accent-foreground border-accent" : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          全年
        </Link>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Link
            key={m}
            href={`/expenses?year=${year}&month=${m}`}
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
          {month ? `${year} 年 ${month} 月支出` : `${year} 年總支出`}
        </p>
        <p className="text-2xl font-medium">{currency.format(total)}</p>
      </div>

      <h2 className="text-base font-medium mb-3">分類佔比</h2>
      {categoryRows.length === 0 ? (
        <p className="text-sm text-foreground-muted mb-7">這一年還沒有支出記錄。</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden mb-7">
          {categoryRows.map(([label, amount]) => (
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
      {expenses.length === 0 ? (
        <p className="text-sm text-foreground-muted">這一年還沒有支出記錄。</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {expenses.map((e) => (
              <Link
                key={e.id}
                href={`/expenses/${e.id}`}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {e.expenseCategory?.name ?? e.category ?? "未分類"}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5 truncate">
                    {formatDate(e.occurredAt)}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="text-sm font-mono shrink-0 text-[color:var(--danger-fg)]">
                  -{currency.format(Number(e.amount))}
                </span>
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
