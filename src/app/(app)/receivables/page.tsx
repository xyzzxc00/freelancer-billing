import Link from "next/link";
import { DueDateInput } from "@/components/DueDateInput";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { markReceivablePaidAction, setReceivableDueDateAction } from "./actions";

import { currency, formatDate, toDateInputValue } from "@/lib/currency";

export default async function ReceivablesPage() {
  const userId = await requireUserId();

  const [pending, paid] = await Promise.all([
    prisma.receivable.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { dueDate: "asc" },
      include: { quote: { include: { client: true } } },
    }),
    prisma.receivable.findMany({
      where: { userId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 50,
      include: { quote: { include: { client: true } } },
    }),
  ]);

  const now = new Date();
  const overdueTotal = pending
    .filter((r) => r.dueDate && r.dueDate < now)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingTotal = pending.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
        <h1 className="text-lg font-medium mb-4">待收款</h1>

        <div className="grid grid-cols-2 gap-3 mb-7">
          <div className="bg-surface rounded-lg p-4">
            <p className="text-sm text-foreground-muted mb-1.5">待收款總額</p>
            <p className="text-2xl font-medium">{currency.format(pendingTotal)}</p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <p className="text-sm text-foreground-muted mb-1.5">逾期未收</p>
            <p className="text-2xl font-medium text-[color:var(--danger-fg)]">
              {currency.format(overdueTotal)}
            </p>
          </div>
        </div>

        <h2 className="text-base font-medium mb-3">待收款中</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-foreground-muted mb-7">目前沒有待收款項目。</p>
        ) : (
          <div className="flex flex-col gap-2 mb-7">
            {pending.map((r) => {
              const isOverdue = r.dueDate && r.dueDate < now;
              const markPaid = markReceivablePaidAction.bind(null, r.id);
              const setDueDate = setReceivableDueDateAction.bind(null, r.id);
              return (
                <div
                  key={r.id}
                  className="border border-border rounded-lg px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/quotes/${r.quote.id}`}
                      className="text-sm font-medium truncate block hover:text-accent"
                    >
                      {r.quote.client.name} — {r.quote.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <DueDateInput action={setDueDate} defaultValue={toDateInputValue(r.dueDate)} />
                      {isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-danger-bg text-danger-fg">
                          已逾期
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium font-mono">
                      {currency.format(Number(r.amount))}
                    </span>
                    <form action={markPaid}>
                      <button
                        type="submit"
                        className="bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                      >
                        標記已收款
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="text-base font-medium mb-3">已收款</h2>
        {paid.length === 0 ? (
          <p className="text-sm text-foreground-muted">還沒有已收款記錄。</p>
        ) : (
          <div className="flex flex-col gap-2">
            {paid.map((r) => (
              <Link
                key={r.id}
                href={`/quotes/${r.quote.id}`}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-surface transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{r.quote.client.name} — {r.quote.title}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {r.paidAt ? formatDate(r.paidAt) : ""} 收款
                  </p>
                </div>
                <span className="text-sm font-mono">{currency.format(Number(r.amount))}</span>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
