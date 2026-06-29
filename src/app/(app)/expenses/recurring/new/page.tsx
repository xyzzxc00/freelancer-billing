import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { RecurringForm } from "@/components/RecurringForm";
import { createRecurringExpenseAction } from "../actions";

export default async function NewRecurringExpensePage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">新增定期支出</h1>
        <Link href="/expenses/recurring" className="text-sm text-foreground-muted hover:text-foreground">
          取消
        </Link>
      </div>

      <RecurringForm
        action={createRecurringExpenseAction}
        categories={categories}
        namePlaceholder="例如：Figma 月費"
        dayLabel="每月扣款日"
      />
    </div>
  );
}
