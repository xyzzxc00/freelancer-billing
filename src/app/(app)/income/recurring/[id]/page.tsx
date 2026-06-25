import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
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
    <div className="px-4 sm:px-6 py-6 max-w-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">編輯定期收入</h1>
        <Link
          href="/income/recurring"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
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
  );
}
