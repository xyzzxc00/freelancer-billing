import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { currency, formatDate } from "@/lib/currency";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam, month: monthParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) : null;
  const rangeStart = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const rangeEnd = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);

  const income = await prisma.transaction.findMany({
    where: {
      userId,
      type: "INCOME",
      occurredAt: { gte: rangeStart, lt: rangeEnd },
    },
    orderBy: { occurredAt: "desc" },
    include: { incomeCategory: true },
  });

  const total = income.reduce((sum, i) => sum + Number(i.amount), 0);

  const bySource = new Map<string, number>();
  for (const i of income) {
    const label = i.incomeCategory?.name ?? i.category ?? "未分類";
    bySource.set(label, (bySource.get(label) ?? 0) + Number(i.amount));
  }
  const sourceRows = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="px-4 sm:px-6 py-6">
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
      )}
    </div>
  );
}
