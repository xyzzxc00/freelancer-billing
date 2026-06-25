import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CategoryForm } from "@/components/CategoryForm";
import { MergeCategoryForm } from "@/components/MergeCategoryForm";
import { createIncomeCategoryAction, deleteIncomeCategoryAction, mergeIncomeCategoryAction, renameIncomeCategoryAction } from "./actions";
import { InlineCategoryEdit } from "@/components/InlineCategoryEdit";

export default async function IncomeCategoriesPage() {
  const userId = await requireUserId();

  const categories = await prisma.incomeCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">收入分類</h1>
            <Link href="/income" className="text-sm text-foreground-muted hover:text-foreground">
              返回
            </Link>
          </div>

          <CategoryForm action={createIncomeCategoryAction} placeholder="例如：接案收入" />

          {categories.length === 0 ? (
            <p className="text-sm text-foreground-muted">還沒有分類，先新增一個吧。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((category) => {
                const deleteAction = deleteIncomeCategoryAction.bind(null, category.id);
                const others = categories.filter((c) => c.id !== category.id);
                return (
                  <div
                    key={category.id}
                    className="border border-border rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <InlineCategoryEdit
                          categoryId={category.id}
                          currentName={category.name}
                          renameAction={renameIncomeCategoryAction}
                        />
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {category._count.transactions} 筆記錄
                        </p>
                      </div>
                      <ConfirmDeleteButton
                        action={deleteAction}
                        confirmMessage={
                          category._count.transactions > 0
                            ? `確定要刪除「${category.name}」嗎？${category._count.transactions} 筆記錄會變回未分類。`
                            : `確定要刪除「${category.name}」嗎？`
                        }
                        successMessage="已刪除分類"
                        className="text-sm text-foreground-muted hover:text-[color:var(--danger-fg)]"
                      />
                    </div>
                    {category._count.transactions > 0 && others.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <MergeCategoryForm
                          categoryId={category.id}
                          otherCategories={others}
                          mergeAction={mergeIncomeCategoryAction}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TipPanel
          title="分類越清楚，報表越好讀"
          description="幫收入建立幾個常用分類，記錄時直接選，之後在「收入」頁面就能看到每個來源佔比，清楚知道錢從哪裡來。"
          steps={[
            "想幾個常見的收入來源（接案收入、顧問費、版權收益等）",
            "記收入時從下拉選單選對分類",
            "分類用不到了可以直接刪除，舊記錄不會被刪除，只會變回未分類",
          ]}
        />
      </div>
    </div>
  );
}
