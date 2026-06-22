import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createIncomeAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewIncomePage() {
  const userId = await requireUserId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const income = await prisma.transaction.aggregate({
    where: { userId, type: "INCOME", occurredAt: { gte: monthStart, lt: monthEnd } },
    _sum: { amount: true },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增收入</h1>
            <Link
              href="/transactions"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              取消
            </Link>
          </div>

          <form action={createIncomeAction} className="flex flex-col gap-3">
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
              <label className="text-sm text-foreground-muted block mb-1">來源（選填）</label>
              <input
                name="category"
                placeholder="例如：接案收入、出售二手設備"
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
          title="報價單接受後會自動記一筆，這裡是給其他收入用的"
          description="客戶接受報價、標記已收款時，系統已經會自動建立收入記錄。這裡用來記不是來自報價單的收入，例如零售、二手交易等。"
          itemsLabel="本月概況"
          steps={[
            "接案的主要收入建議都走報價單流程，會自動記帳又能追蹤待收款",
            "這裡只需要記非報價單來源的零星收入",
            "支出請改到「支出」頁面記錄，可以分類、也能設定定期自動產生",
          ]}
        >
          <div className="border border-border rounded-md p-3">
            <p className="text-xs text-foreground-muted mb-1">本月收入</p>
            <p className="text-sm font-mono">{currency.format(Number(income._sum.amount ?? 0))}</p>
          </div>
        </TipPanel>
      </div>
    </div>
  );
}
