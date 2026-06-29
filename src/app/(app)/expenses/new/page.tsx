import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { ExpenseForm } from "@/components/ExpenseForm";
import { createExpenseAction } from "../actions";

export default async function NewExpensePage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
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

        <TipPanel
          title="先分類，之後統計更清楚"
          description="記支出時選好分類，之後在支出報表就能直接看到各分類佔比，不用自己手動加總。"
          itemsLabel="你的分類"
          steps={[
            "把常見的花費歸成幾個分類（軟體訂閱、交通、設備等）",
            "每筆支出記錄時選對分類",
            "到「支出」頁面看年度分類佔比，抓大頭開銷一目了然",
          ]}
        >
          {categories.length > 0 &&
            categories.map((c) => (
              <div key={c.id} className="border border-border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm">{c.name}</span>
                <span className="text-xs text-foreground-muted">{c._count.transactions} 筆</span>
              </div>
            ))}
        </TipPanel>
      </div>
    </div>
  );
}
