import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  toggleRecurringExpenseAction,
  deleteRecurringExpenseAction,
} from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function RecurringExpensesPage() {
  const userId = await requireUserId();

  const recurring = await prisma.recurringExpense.findMany({
    where: { userId },
    orderBy: { dayOfMonth: "asc" },
    include: { category: true },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">定期支出</h1>
        <Link href="/expenses" className="text-sm text-foreground-muted hover:text-foreground">
          返回
        </Link>
      </div>

      <Link
        href="/expenses/recurring/new"
        className="text-sm text-accent hover:underline block mb-4"
      >
        + 新增定期支出
      </Link>

      {recurring.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          還沒有定期支出，新增後系統會在每月指定日期自動建立支出記錄。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recurring.map((r) => {
            const toggleAction = toggleRecurringExpenseAction.bind(null, r.id, !r.active);
            const deleteAction = deleteRecurringExpenseAction.bind(null, r.id);
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
                    href={`/expenses/recurring/${r.id}`}
                    className="text-xs text-foreground-muted hover:text-foreground"
                  >
                    編輯
                  </Link>
                  <ConfirmDeleteButton
                    action={deleteAction}
                    confirmMessage="確定要刪除這個定期支出嗎？此操作無法復原。"
                    successMessage="已刪除定期支出"
                    className="text-xs text-foreground-muted hover:text-[color:var(--danger-fg)]"
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
