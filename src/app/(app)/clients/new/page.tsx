import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TipPanel } from "@/components/TipPanel";
import { createClientAction } from "../actions";

const avatarTones = [
  "bg-[#FAECE7] text-[#712B13]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#FAEEDA] text-[#633806]",
  "bg-[#FBEAF0] text-[#72243E]",
];

export default async function NewClientPage() {
  const userId = await requireUserId();

  const recentClients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
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
              className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium mt-2 self-start px-6"
            >
              新增客戶
            </button>
          </form>
        </div>

        <TipPanel
          title="先建好客戶，開單更快"
          description="之後開報價單時可以直接選這位客戶，不用每次重新打聯絡資訊。"
          itemsLabel="你的客戶"
          steps={[
            "填好名稱跟聯絡方式，按下新增客戶",
            "開報價單時直接從清單選這位客戶，不用重打資訊",
            "案件累積後，到客戶頁面就能看到完整合作歷史",
          ]}
        >
          {recentClients.length > 0 &&
            recentClients.map((client, i) => (
              <div
                key={client.id}
                className="border border-border rounded-md p-3 flex items-center gap-2.5"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${avatarTones[i % avatarTones.length]}`}
                >
                  {client.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-foreground-muted">{client._count.quotes} 個案件</p>
                </div>
              </div>
            ))}
        </TipPanel>
      </div>
    </div>
  );
}
