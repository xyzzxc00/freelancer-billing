import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ClientForm } from "@/components/ClientForm";
import { currency } from "@/lib/currency";
import { startOfTodayTaipei } from "@/lib/taipei";
import { buildPaymentPunctuality } from "@/lib/client-insights";
import { updateClientAction, deleteClientAction } from "../actions";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已送出",
  ACCEPTED: "已接受",
  REJECTED: "已拒絕",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) {
    notFound();
  }

  const today = startOfTodayTaipei();

  // 統計一律算全歷史（不受「案件歷史」清單的 take:20 截斷影響）
  const [recentQuotes, acceptedItems, pendingAgg, paidReceivables, overdueAgg] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId: id, userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: true },
    }),
    prisma.quoteItem.findMany({
      where: { quote: { clientId: id, userId, status: "ACCEPTED" } },
      select: { unitPrice: true, quantity: true },
    }),
    prisma.receivable.aggregate({
      where: { quote: { clientId: id, userId }, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.receivable.findMany({
      where: { quote: { clientId: id, userId }, status: "PAID" },
      select: { amount: true, dueDate: true, paidAt: true },
    }),
    prisma.receivable.aggregate({
      where: { quote: { clientId: id, userId }, status: "PENDING", dueDate: { lt: today } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = acceptedItems.reduce(
    (sum, i) => sum + Number(i.unitPrice) * Number(i.quantity),
    0
  );
  const pendingAmount = Number(pendingAgg._sum.amount ?? 0);
  const paidAmount = paidReceivables.reduce((sum, r) => sum + Number(r.amount), 0);

  const punctuality = buildPaymentPunctuality(
    paidReceivables
      .filter((r): r is typeof r & { dueDate: Date; paidAt: Date } => r.dueDate !== null && r.paidAt !== null)
      .map((r) => ({ dueDate: r.dueDate, paidAt: r.paidAt }))
  );
  const currentOverdueCount = overdueAgg._count;
  const currentOverdueAmount = Number(overdueAgg._sum.amount ?? 0);

  const updateAction = updateClientAction.bind(null, client.id);
  const deleteAction = deleteClientAction.bind(null, client.id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-4xl">
      <div className="border border-border rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">客戶資料</h1>
          <Link href="/clients" className="text-sm text-foreground-muted hover:text-foreground">
            返回
          </Link>
        </div>

        {totalRevenue > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-foreground-muted mb-1">已接受總額</p>
              <p className="text-sm font-medium font-mono">{currency.format(totalRevenue)}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-foreground-muted mb-1">待收款</p>
              <p className="text-sm font-medium font-mono">{currency.format(pendingAmount)}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-foreground-muted mb-1">已收款</p>
              <p className="text-sm font-medium font-mono">{currency.format(paidAmount)}</p>
            </div>
          </div>
        )}

        {(punctuality.count > 0 || currentOverdueCount > 0) && (
          <div className="bg-surface rounded-lg p-3 mb-5">
            <p className="text-xs text-foreground-muted mb-1.5">付款狀況</p>
            {punctuality.count > 0 && (
              <p className="text-sm">
                平均
                {punctuality.avgDaysLate! > 0
                  ? `晚 ${punctuality.avgDaysLate} 天付款`
                  : punctuality.avgDaysLate! < 0
                    ? `提前 ${-punctuality.avgDaysLate!} 天付款`
                    : "準時付款"}
                <span className="text-foreground-muted">
                  （準時 {punctuality.onTimeCount} 次・逾期 {punctuality.lateCount} 次）
                </span>
              </p>
            )}
            {currentOverdueCount > 0 && (
              <p className="text-sm text-[color:var(--danger-fg)] mt-1">
                目前有 {currentOverdueCount} 筆逾期，共 {currency.format(currentOverdueAmount)}
              </p>
            )}
          </div>
        )}

        <ClientForm
          action={updateAction}
          defaultName={client.name}
          defaultContact={client.contact ?? ""}
          defaultNote={client.note ?? ""}
          submitLabel="儲存變更"
        />

        <div className="mt-2">
          <ConfirmDeleteButton
            action={deleteAction}
            confirmMessage="確定要刪除這位客戶嗎？此操作無法復原。"
            successMessage="已刪除客戶"
            className="text-sm text-[color:var(--danger-fg)] hover:underline"
            label="刪除這位客戶"
          />
        </div>

        <h2 className="text-base font-medium mt-8 mb-3">案件歷史</h2>
        {recentQuotes.length === 0 ? (
          <p className="text-sm text-foreground-muted">這位客戶還沒有報價單。</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentQuotes.map((quote) => {
              const total = quote.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
                >
                  <p className="text-sm font-medium truncate min-w-0">{quote.title}</p>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-mono">
                      {currency.format(total)}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface text-foreground-muted">
                      {statusLabel[quote.status]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
