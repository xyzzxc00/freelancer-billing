import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteExpenseAction } from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const rangeStart = new Date(year, 0, 1);
  const rangeEnd = new Date(year + 1, 0, 1);

  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      occurredAt: { gte: rangeStart, lt: rangeEnd },
    },
    orderBy: { occurredAt: "desc" },
    include: { expenseCategory: true },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const label = e.expenseCategory?.name ?? e.category ?? "未分類";
    byCategory.set(label, (byCategory.get(label) ?? 0) + Number(e.amount));
  }
  const categoryRows = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="px-4 sm:px-6 py-6">
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

      <div className="bg-surface rounded-lg p-4 mb-7">
        <p className="text-sm text-foreground-muted mb-1.5">{year} 年總支出</p>
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
        <div className="flex flex-col gap-2">
          {expenses.map((e) => {
            const deleteAction = deleteExpenseAction.bind(null, e.id);
            return (
              <div
                key={e.id}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {e.expenseCategory?.name ?? e.category ?? "未分類"}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5 truncate">
                    {e.occurredAt.toLocaleDateString("zh-TW")}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono text-[color:var(--danger-fg)]">
                    -{currency.format(Number(e.amount))}
                  </span>
                  <ConfirmDeleteButton
                    action={deleteAction}
                    confirmMessage="確定要刪除這筆支出嗎？此操作無法復原。"
                    successMessage="已刪除支出"
                    className="text-sm text-foreground-muted hover:text-[color:var(--danger-fg)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
