import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { RecurringForm } from "@/components/RecurringForm";
import { createRecurringIncomeAction } from "../actions";

export default async function NewRecurringIncomePage() {
  const userId = await requireUserId();

  const categories = await prisma.incomeCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
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
  );
}
