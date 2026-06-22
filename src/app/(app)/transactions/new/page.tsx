import Link from "next/link";
import { createTransactionAction } from "../actions";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTransactionPage() {
  return (
    <div className="px-6 py-6 max-w-sm">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">新增收支記錄</h1>
          <Link
            href="/transactions"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            取消
          </Link>
        </div>

        <form action={createTransactionAction} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-foreground-muted block mb-1">類型</label>
            <select
              name="type"
              defaultValue="EXPENSE"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            >
              <option value="EXPENSE">支出</option>
              <option value="INCOME">收入</option>
            </select>
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
            <label className="text-sm text-foreground-muted block mb-1">分類</label>
            <input
              name="category"
              placeholder="例如：軟體訂閱、交通、接案收入"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
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
            className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2"
          >
            儲存
          </button>
        </form>
    </div>
  );
}
