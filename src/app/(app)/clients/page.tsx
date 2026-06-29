import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 30;

const avatarTones = [
  "bg-[#FAECE7] text-[#712B13]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#FAEEDA] text-[#633806]",
  "bg-[#FBEAF0] text-[#72243E]",
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const userId = await requireUserId();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = { userId };
  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotes: true } } },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-6xl">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">客戶</h1>
          <Link href="/clients/new" className="text-sm text-accent hover:underline">
            + 新增客戶
          </Link>
        </div>

        {totalCount === 0 ? (
          <p className="text-sm text-foreground-muted py-12 text-center">
            還沒有客戶資料，先新增一個吧。
          </p>
        ) : (
          <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {clients.map((client, i) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="border border-border rounded-lg p-3.5 text-center hover:border-[color:var(--border)] hover:bg-surface transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2 ${avatarTones[((page - 1) * PAGE_SIZE + i) % avatarTones.length]}`}
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
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            buildHref={(p) => `/clients${p > 1 ? `?page=${p}` : ""}`}
          />
          </>
        )}
    </div>
  );
}
