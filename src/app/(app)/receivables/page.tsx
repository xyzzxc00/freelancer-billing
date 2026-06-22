import { DueDateInput } from "@/components/DueDateInput";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { markReceivablePaidAction, setReceivableDueDateAction } from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function ReceivablesPage() {
  const userId = await requireUserId();

  const receivables = await prisma.receivable.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { quote: { include: { client: true } } },
  });

  const now = new Date();
  const pending = receivables.filter((r) => r.status === "PENDING");
  const paid = receivables.filter((r) => r.status === "PAID");
  const overdueTotal = pending
    .filter((r) => r.dueDate && r.dueDate < now)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingTotal = pending.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="px-4 sm:px-6 py-6">
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
                    <p className="text-sm font-medium truncate">
                      {r.quote.client.name} — {r.quote.title}
                    </p>
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
                        className="bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium"
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
              <div
                key={r.id}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {r.quote.client.name} — {r.quote.title}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {r.paidAt ? new Date(r.paidAt).toLocaleDateString("zh-TW") : ""} 收款
                  </p>
                </div>
                <span className="text-sm font-mono">{currency.format(Number(r.amount))}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
