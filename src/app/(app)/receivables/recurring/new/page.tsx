import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { RecurringReceivableForm } from "@/components/RecurringReceivableForm";
import { createRecurringReceivableAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function NewRecurringReceivablePage() {
  const userId = await requireUserId();

  const [clients, existing] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.recurringReceivable.findMany({
      where: { userId, active: true },
      orderBy: { dayOfMonth: "asc" },
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增定期請款</h1>
            <Link href="/receivables/recurring" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          {clients.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              請先到
              <Link href="/clients/new" className="text-accent hover:underline mx-1">
                新增客戶
              </Link>
              ，才能建立定期請款。
            </p>
          ) : (
            <RecurringReceivableForm action={createRecurringReceivableAction} clients={clients} />
          )}
        </div>

        <TipPanel
          title="設定一次，每月自動請款"
          description="系統會在每月指定日期自動產生待收款，適合維護約、顧問約等月費型合約。"
          itemsLabel="目前啟用中"
          steps={[
            "選客戶、填金額跟每月請款日（1-28 號）",
            "到日期自動產生待收款，可直接下載請款單 PDF 或寄催款信",
            "合約結束到列表裡停用，設定會保留",
          ]}
        >
          {existing.length > 0 &&
            existing.map((r) => (
              <div key={r.id} className="border border-border rounded-md p-3 flex items-center justify-between gap-3">
                <p className="text-sm truncate">
                  {r.client.name} — {r.title}
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
