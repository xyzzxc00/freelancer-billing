import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { RecurringForm } from "@/components/RecurringForm";
import { updateRecurringIncomeAction } from "../actions";

export default async function EditRecurringIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [recurring, categories] = await Promise.all([
    prisma.recurringIncome.findFirst({ where: { id, userId } }),
    prisma.incomeCategory.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!recurring) notFound();

  const updateAction = updateRecurringIncomeAction.bind(null, recurring.id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">編輯定期收入</h1>
            <Link href="/income/recurring" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          <RecurringForm
            action={updateAction}
            categories={categories}
            namePlaceholder="例如：顧問合約月費"
            dayLabel="每月入帳日"
            defaultName={recurring.name}
            defaultAmount={String(recurring.amount)}
            defaultDayOfMonth={recurring.dayOfMonth}
            defaultCategoryId={recurring.categoryId ?? ""}
            submitLabel="儲存變更"
          />
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
