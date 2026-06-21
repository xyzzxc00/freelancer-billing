import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

const avatarTones = [
  "bg-[#FAECE7] text-[#712B13]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#FAEEDA] text-[#633806]",
  "bg-[#FBEAF0] text-[#72243E]",
];

export default async function ClientsPage() {
  const userId = await requireUserId();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <div>
      <TopNav active="客戶" />

      <div className="px-6 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">客戶</h1>
          <Link href="/clients/new" className="text-sm text-accent hover:underline">
            + 新增客戶
          </Link>
        </div>

        {clients.length === 0 ? (
          <p className="text-sm text-foreground-muted py-12 text-center">
            還沒有客戶資料，先新增一個吧。
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {clients.map((client, i) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="border border-border rounded-lg p-3.5 text-center hover:border-[color:var(--border)] hover:bg-surface transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2 ${avatarTones[i % avatarTones.length]}`}
                >
                  {client.name.slice(0, 1)}
                </div>
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {client._count.quotes} 個案件
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
