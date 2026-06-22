import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createRecurringExpenseAction } from "../actions";

export default async function NewRecurringExpensePage() {
  const userId = await requireUserId();

  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">新增定期支出</h1>
        <Link
          href="/expenses/recurring"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          取消
        </Link>
      </div>

      <form action={createRecurringExpenseAction} className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-foreground-muted block mb-1">名稱</label>
          <input
            name="name"
            required
            placeholder="例如：Figma 月費"
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
          />
        </div>
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
          <label className="text-sm text-foreground-muted block mb-1">每月扣款日</label>
          <input
            name="dayOfMonth"
            type="number"
            required
            min="1"
            max="28"
            defaultValue="1"
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
          />
          <p className="text-xs text-foreground-muted mt-1">限 1-28 號，避免遇到月底沒有的日期。</p>
        </div>
        <div>
          <label className="text-sm text-foreground-muted block mb-1">分類（選填）</label>
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
        </div>

        <button
          type="submit"
          className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2"
        >
          儲存
        </button>
      </form>
    </div>
  );
}
