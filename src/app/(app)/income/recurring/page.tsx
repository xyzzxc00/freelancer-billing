import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { toggleRecurringIncomeAction, deleteRecurringIncomeAction } from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function RecurringIncomePage() {
  const userId = await requireUserId();

  const recurring = await prisma.recurringIncome.findMany({
    where: { userId },
    orderBy: { dayOfMonth: "asc" },
    include: { category: true },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">定期收入</h1>
            <Link href="/income" className="text-sm text-foreground-muted hover:text-foreground">
              返回
            </Link>
          </div>

          <Link
            href="/income/recurring/new"
            className="text-sm text-accent hover:underline block mb-4"
          >
            + 新增定期收入
          </Link>

          {recurring.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              還沒有定期收入，新增後系統會在每月指定日期自動建立收入記錄，適合長期合約、訂閱制收費等固定收入。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recurring.map((r) => {
                const toggleAction = toggleRecurringIncomeAction.bind(null, r.id, !r.active);
                const deleteAction = deleteRecurringIncomeAction.bind(null, r.id);
                return (
                  <div key={r.id} className="border border-border rounded-lg px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          每月 {r.dayOfMonth} 號 · {r.category?.name ?? "不分類"}
                        </p>
                      </div>
                      <span className="text-sm font-mono shrink-0">
                        {currency.format(Number(r.amount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-0.5 rounded-full ${
                            r.active
                              ? "bg-success-bg text-success-fg"
                              : "bg-surface text-foreground-muted"
                          }`}
                        >
                          {r.active ? "已啟用" : "已停用"}
                        </button>
                      </form>
                      <Link
                        href={`/income/recurring/${r.id}`}
                        className="text-xs text-foreground-muted hover:text-foreground"
                      >
                        編輯
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteAction}
                        confirmMessage="確定要刪除這個定期收入嗎？此操作無法復原。"
                        successMessage="已刪除定期收入"
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
          title="固定收入設一次，之後不用再想"
          description="長期合約、訂閱制收費這類每月都會收到的款項，設定好之後系統會自動記，不用每個月手動再記一次。"
          steps={[
            "填好金額跟每月入帳日（1-28 號）",
            "系統每天會檢查一次，到日期自動建立收入記錄",
            "暫時沒有的話可以停用，不會刪除設定，之後隨時可以重新啟用",
          ]}
        />
      </div>
    </div>
  );
}
