import Link from "next/link";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-md">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">新增客戶</h1>
          <Link href="/clients" className="text-sm text-foreground-muted hover:text-foreground">
            取消
          </Link>
        </div>

        <form action={createClientAction} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-foreground-muted block mb-1">客戶名稱</label>
            <input
              name="name"
              required
              placeholder="例如：林氏設計工作室"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
          </div>
          <div>
            <label className="text-sm text-foreground-muted block mb-1">聯絡方式</label>
            <input
              name="contact"
              placeholder="email / 電話 / Line 等"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
          </div>
          <div>
            <label className="text-sm text-foreground-muted block mb-1">備註</label>
            <textarea
              name="note"
              rows={3}
              placeholder="其他想記下的資訊"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
            />
          </div>

          <button
            type="submit"
            className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2"
          >
            新增客戶
          </button>
        </form>
    </div>
  );
}
