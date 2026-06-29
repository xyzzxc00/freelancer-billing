import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryCard } from "@/components/CategoryCard";
import { createCategoryAction, deleteCategoryAction, mergeExpenseCategoryAction, renameExpenseCategoryAction } from "./actions";

export default async function ExpenseCategoriesPage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">支出分類</h1>
        <Link href="/expenses" className="text-sm text-foreground-muted hover:text-foreground">
          返回
        </Link>
      </div>

      <CategoryForm action={createCategoryAction} placeholder="例如：軟體訂閱" />

      {categories.length === 0 ? (
        <p className="text-sm text-foreground-muted">還沒有分類，先新增一個吧。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => {
            const deleteAction = deleteCategoryAction.bind(null, category.id);
            const others = categories.filter((c) => c.id !== category.id);
            return (
              <CategoryCard
                key={category.id}
                category={category}
                others={others}
                renameAction={renameExpenseCategoryAction}
                deleteAction={deleteAction}
                mergeAction={mergeExpenseCategoryAction}
                deleteConfirmMessage={
                  category._count.transactions > 0
                    ? `確定要刪除「${category.name}」嗎？${category._count.transactions} 筆記錄會變回未分類。`
                    : `確定要刪除「${category.name}」嗎？`
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
