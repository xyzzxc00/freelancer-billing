import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createRecurringExpenseAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function NewRecurringExpensePage() {
  const userId = await requireUserId();

  const [categories, existing] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.recurringExpense.findMany({
      where: { userId, active: true },
      orderBy: { dayOfMonth: "asc" },
    }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增定期支出</h1>
            <Link
              href="/expenses/recurring"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              取消
            </Link>
          </div>

          <form action={createRecurringExpenseAction} className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-foreground-muted block mb-1">名稱</label>
              <input
                name="name"
                required
                placeholder="例如：Figma 月費"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">金額</label>
              <input
                name="amount"
                type="number"
                required
                min="0"
                step="1"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">每月扣款日</label>
              <input
                name="dayOfMonth"
                type="number"
                required
                min="1"
                max="28"
                defaultValue="1"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
              />
              <p className="text-xs text-foreground-muted mt-1">限 1-28 號，避免遇到月底沒有的日期。</p>
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">分類（選填）</label>
              <select
                name="categoryId"
                defaultValue=""
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              >
                <option value="">不分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2 self-start px-6"
            >
              儲存
            </button>
          </form>
        </div>

        <TipPanel
          title="設定一次，之後不用再手動記"
          description="系統會在每月指定日期自動建立這筆支出記錄，適合訂閱制的固定花費。"
          itemsLabel="目前啟用中"
          steps={[
            "填好金額跟每月扣款日（1-28 號）",
            "系統每天會檢查一次，到日期自動建立支出記錄",
            "不用的時候到列表裡停用，資料會保留但不再自動產生",
          ]}
        >
          {existing.length > 0 &&
            existing.map((r) => (
              <div
                key={r.id}
                className="border border-border rounded-md p-3 flex items-center justify-between gap-3"
              >
                <p className="text-sm truncate">
                  {r.name}
                  <span className="text-foreground-muted"> · 每月 {r.dayOfMonth} 號</span>
                </p>
                <span className="text-xs font-mono text-foreground-muted shrink-0">
                  {currency.format(Number(r.amount))}
                </span>
              </div>
            ))}
        </TipPanel>
      </div>
    </div>
  );
}
