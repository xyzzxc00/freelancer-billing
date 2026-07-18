import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { toggleRecurringReceivableAction, deleteRecurringReceivableAction } from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function RecurringReceivablePage() {
  const userId = await requireUserId();

  const recurring = await prisma.recurringReceivable.findMany({
    where: { userId },
    orderBy: { dayOfMonth: "asc" },
    include: { client: { select: { name: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">定期請款</h1>
            <Link href="/receivables" className="text-sm text-foreground-muted hover:text-foreground">
              返回
            </Link>
          </div>

          <Link href="/receivables/recurring/new" className="text-sm text-accent hover:underline block mb-4">
            + 新增定期請款
          </Link>

          {recurring.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              還沒有定期請款。有維護約、顧問約這類每月固定收費的客戶時，設定一次，系統就會每月自動產生待收款並追蹤逾期，不用每個月手動開請款單。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recurring.map((r) => {
                const toggleAction = toggleRecurringReceivableAction.bind(null, r.id, !r.active);
                const deleteAction = deleteRecurringReceivableAction.bind(null, r.id);
                return (
                  <div key={r.id} className="border border-border rounded-lg px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.client.name} — {r.title}
                        </p>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          每月 {r.dayOfMonth} 號請款 · {r.dueInDays} 天內付款
                        </p>
                      </div>
                      <span className="text-sm font-mono shrink-0">{currency.format(Number(r.amount))}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-0.5 rounded-full ${r.active ? "bg-success-bg text-success-fg" : "bg-surface text-foreground-muted"}`}
                        >
                          {r.active ? "已啟用" : "已停用"}
                        </button>
                      </form>
                      <Link href={`/receivables/recurring/${r.id}`} className="text-xs text-foreground-muted hover:text-foreground">
                        編輯
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteAction}
                        confirmMessage="確定要刪除這個定期請款嗎？已產生的待收款會保留，此操作無法復原。"
                        successMessage="已刪除定期請款"
                        className="text-xs text-foreground-muted hover:text-[color:var(--danger-fg)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TipPanel
          title="月費客戶的請款自動化"
          description="定期請款會每月自動產生一筆待收款，收款追蹤、逾期提醒、催款信都跟一般待收款一樣。"
          steps={[
            "選客戶、填金額跟每月請款日（1-28 號）",
            "系統每天檢查一次，到日期自動產生待收款，標題會帶上月份",
            "到期沒收到款會出現在逾期提醒，可以直接寄催款信",
            "合約結束就停用，設定會保留，之後可以重新啟用",
          ]}
        />
      </div>
    </div>
  );
}
