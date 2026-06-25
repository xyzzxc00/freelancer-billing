import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { RecurringForm } from "@/components/RecurringForm";
import { updateRecurringExpenseAction } from "../actions";

export default async function EditRecurringExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [recurring, categories] = await Promise.all([
    prisma.recurringExpense.findFirst({ where: { id, userId } }),
    prisma.expenseCategory.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!recurring) notFound();

  const updateAction = updateRecurringExpenseAction.bind(null, recurring.id);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">編輯定期支出</h1>
        <Link
          href="/expenses/recurring"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          取消
        </Link>
      </div>

      <RecurringForm
        action={updateAction}
        categories={categories}
        namePlaceholder="例如：Adobe 訂閱"
        dayLabel="每月扣款日"
        defaultName={recurring.name}
        defaultAmount={String(recurring.amount)}
        defaultDayOfMonth={recurring.dayOfMonth}
        defaultCategoryId={recurring.categoryId ?? ""}
        submitLabel="儲存變更"
      />
    </div>
  );
}
