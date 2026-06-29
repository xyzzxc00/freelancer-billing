import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import { createExpenseAction } from "../actions";

export default async function NewExpensePage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">新增支出</h1>
        <Link href="/expenses" className="text-sm text-foreground-muted hover:text-foreground">
          取消
        </Link>
      </div>

      <ExpenseForm
        action={createExpenseAction}
        categories={categories}
        categoriesHref="/expenses/categories"
      />
    </div>
  );
}
