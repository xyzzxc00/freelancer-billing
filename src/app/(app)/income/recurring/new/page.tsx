import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { RecurringForm } from "@/components/RecurringForm";
import { createRecurringIncomeAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function NewRecurringIncomePage() {
  const userId = await requireUserId();

  const [categories, existing] = await Promise.all([
    prisma.incomeCategory.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.recurringIncome.findMany({ where: { userId, active: true }, orderBy: { dayOfMonth: "asc" } }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增定期收入</h1>
            <Link href="/income/recurring" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          <RecurringForm
            action={createRecurringIncomeAction}
            categories={categories}
            namePlaceholder="例如：顧問合約月費"
            dayLabel="每月入帳日"
          />
        </div>

        <TipPanel
          title="設定一次，之後不用再手動記"
          description="系統會在每月指定日期自動建立這筆收入記錄，適合長期合約、訂閱制收費等固定收入。"
          itemsLabel="目前啟用中"
          steps={[
            "填好金額跟每月入帳日（1-28 號）",
            "系統每天會檢查一次，到日期自動建立收入記錄",
            "不用的時候到列表裡停用，資料會保留但不再自動產生",
          ]}
        >
          {existing.length > 0 &&
            existing.map((r) => (
              <div key={r.id} className="border border-border rounded-md p-3 flex items-center justify-between gap-3">
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
