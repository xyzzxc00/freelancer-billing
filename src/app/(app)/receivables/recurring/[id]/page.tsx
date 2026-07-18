import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { RecurringReceivableForm } from "@/components/RecurringReceivableForm";
import { updateRecurringReceivableAction } from "../actions";

export default async function EditRecurringReceivablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [recurring, clients] = await Promise.all([
    prisma.recurringReceivable.findFirst({ where: { id, userId } }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!recurring) notFound();

  const updateAction = updateRecurringReceivableAction.bind(null, recurring.id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">編輯定期請款</h1>
            <Link href="/receivables/recurring" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          <RecurringReceivableForm
            action={updateAction}
            clients={clients}
            defaultTitle={recurring.title}
            defaultAmount={String(recurring.amount)}
            defaultClientId={recurring.clientId}
            defaultDayOfMonth={recurring.dayOfMonth}
            defaultDueInDays={recurring.dueInDays}
            submitLabel="儲存變更"
          />
        </div>

        <TipPanel
          title="月費客戶的請款自動化"
          description="定期請款會每月自動產生一筆待收款，收款追蹤、逾期提醒、催款信都跟一般待收款一樣。"
          steps={[
            "改金額或請款日只影響之後產生的待收款，已產生的不會變",
            "合約結束建議用停用而不是刪除，設定跟歷史脈絡都會保留",
          ]}
        />
      </div>
    </div>
  );
}
