import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createIncomeCategoryAction, deleteIncomeCategoryAction } from "./actions";

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

          <form action={createIncomeCategoryAction} className="flex gap-2 mb-6">
            <input
              name="name"
              required
              placeholder="例如：接案收入"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1"
            />
            <button
              type="submit"
              className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
            >
              新增
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="text-sm text-foreground-muted">還沒有分類，先新增一個吧。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((category) => {
                const deleteAction = deleteIncomeCategoryAction.bind(null, category.id);
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
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        className="text-sm text-foreground-muted hover:text-[color:var(--danger-fg)]"
                      >
                        刪除
                      </button>
                    </form>
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
