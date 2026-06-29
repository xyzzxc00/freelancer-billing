import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { IncomeForm } from "@/components/IncomeForm";
import { createIncomeAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function NewIncomePage() {
  const userId = await requireUserId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [income, categories] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", occurredAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.incomeCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增收入</h1>
            <Link href="/income" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          <IncomeForm
            action={createIncomeAction}
            categories={categories}
            categoriesHref="/income/categories"
          />
        </div>

        <TipPanel
          title="報價單接受後會自動記一筆，這裡是給其他收入用的"
          description="客戶接受報價、標記已收款時，系統已經會自動建立收入記錄。這裡用來記不是來自報價單的收入，例如零售、二手交易等。"
          itemsLabel="本月概況"
          steps={[
            "接案的主要收入建議都走報價單流程，會自動記帳又能追蹤待收款",
            "這裡只需要記非報價單來源的零星收入，記得選對分類方便之後統計",
            "長期固定收入可以改用「定期收入」，設定一次就不用每月手動記",
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
