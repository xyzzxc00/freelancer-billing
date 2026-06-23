import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CategoryForm } from "@/components/CategoryForm";
import { createCategoryAction, deleteCategoryAction } from "./actions";

export default async function ExpenseCategoriesPage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
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
                return (
                  <div
                    key={category.id}
                    className="border border-border rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {category._count.transactions} 筆記錄
                      </p>
                    </div>
                    <ConfirmDeleteButton
                      action={deleteAction}
                      confirmMessage="確定要刪除這個分類嗎？相關記錄會變回未分類。"
                      successMessage="已刪除分類"
                      className="text-sm text-foreground-muted hover:text-[color:var(--danger-fg)]"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TipPanel
          title="分類越清楚，報表越好讀"
          description="幫支出建立幾個常用分類，記錄時直接選，之後在「支出」頁面就能看到每個分類佔比，一眼抓出花費最多的地方。"
          steps={[
            "想幾個常見的支出種類（軟體訂閱、交通、設備、行銷等）",
            "記支出時從下拉選單選對分類",
            "分類用不到了可以直接刪除，舊記錄不會被刪除，只會變回未分類",
          ]}
        />
      </div>
    </div>
  );
}
