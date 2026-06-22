import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createTransactionAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewTransactionPage() {
  const userId = await requireUserId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", occurredAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", occurredAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 items-start">
        <div className="max-w-sm w-full">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增收支記錄</h1>
            <Link
              href="/transactions"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              取消
            </Link>
          </div>

          <form action={createTransactionAction} className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-foreground-muted block mb-1">類型</label>
              <select
                name="type"
                defaultValue="EXPENSE"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              >
                <option value="EXPENSE">支出</option>
                <option value="INCOME">收入</option>
              </select>
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
              <label className="text-sm text-foreground-muted block mb-1">分類</label>
              <input
                name="category"
                placeholder="例如：軟體訂閱、交通、接案收入"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">日期</label>
              <input
                name="occurredAt"
                type="date"
                required
                defaultValue={todayInputValue()}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">備註</label>
              <input
                name="note"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
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
          title="收支記得越完整，報稅越省事"
          description="每筆收入支出記下來，年底報稅時自己抓資料會輕鬆很多。支出類記錄想要分類管理跟自動產生，可以改用「支出」頁面。"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">本月收入</span>
            <span className="text-sm font-mono">{currency.format(Number(income._sum.amount ?? 0))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">本月支出</span>
            <span className="text-sm font-mono">{currency.format(Number(expense._sum.amount ?? 0))}</span>
          </div>
        </TipPanel>
      </div>
    </div>
  );
}
