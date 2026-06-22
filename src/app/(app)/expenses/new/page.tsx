import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createExpenseAction } from "../actions";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewExpensePage() {
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
            <h1 className="text-lg font-medium">新增支出</h1>
            <Link href="/expenses" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          <form action={createExpenseAction} className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-foreground-muted block mb-1">金額</label>
              <input
                name="amount"
                type="number"
                required
                min="0"
                step="1"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">分類</label>
              <select
                name="categoryId"
                defaultValue=""
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              >
                <option value="">不分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-foreground-muted mt-1">
                  還沒有分類，去
                  <Link href="/expenses/categories" className="text-accent hover:underline mx-1">
                    新增分類
                  </Link>
                  方便之後統計。
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">日期</label>
              <input
                name="occurredAt"
                type="date"
                required
                defaultValue={todayInputValue()}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-muted block mb-1">備註</label>
              <input
                name="note"
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
              />
            </div>

            <button
              type="submit"
              className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2 self-start px-6"
            >
              儲存
            </button>
          </form>
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
              <div
                key={c.id}
                className="border border-border rounded-md p-3 flex items-center justify-between"
              >
                <span className="text-sm">{c.name}</span>
                <span className="text-xs text-foreground-muted">{c._count.transactions} 筆</span>
              </div>
            ))}
        </TipPanel>
      </div>
    </div>
  );
}
