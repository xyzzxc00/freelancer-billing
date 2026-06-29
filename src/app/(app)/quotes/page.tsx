import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Pagination } from "@/components/Pagination";
import { currency, formatDate } from "@/lib/currency";

const PAGE_SIZE = 20;

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已送出",
  ACCEPTED: "已接受",
  REJECTED: "已拒絕",
};

const statusTone: Record<string, string> = {
  DRAFT: "bg-surface text-foreground-muted",
  SENT: "bg-warning-bg text-warning-fg",
  ACCEPTED: "bg-success-bg text-success-fg",
  REJECTED: "bg-danger-bg text-danger-fg",
};

const validStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
type QuoteStatus = (typeof validStatuses)[number];

const filterTabs: { label: string; value: string }[] = [
  { label: "全部", value: "" },
  { label: "草稿", value: "DRAFT" },
  { label: "已送出", value: "SENT" },
  { label: "已接受", value: "ACCEPTED" },
  { label: "已拒絕", value: "REJECTED" },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const userId = await requireUserId();
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const statusFilter =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as QuoteStatus)
      : undefined;

  const where: Prisma.QuoteWhereInput = {
    userId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: true, items: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.quote.count({ where }),
  ]);

  function tabHref(value: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("status", value);
    const qs = params.toString();
    return `/quotes${qs ? `?${qs}` : ""}`;
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/quotes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-6xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">報價單</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/quotes/templates"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            範本
          </Link>
          <Link href="/quotes/new" className="text-sm text-accent hover:underline">
            + 新增報價單
          </Link>
        </div>
      </div>

      <form method="get" action="/quotes" className="mb-4">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜尋報價單或客戶名稱…"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
        />
      </form>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filterTabs.map((tab) => {
          const active = (status ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-foreground-muted py-12 text-center">
          {q || statusFilter ? "沒有符合條件的報價單。" : "還沒有報價單，先新增一個吧。"}
        </p>
      ) : (
        <>
        <div className="flex flex-col gap-2">
          {quotes.map((quote) => {
            const total = quote.items.reduce(
              (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
              0
            );
            const staleDays =
              quote.status === "SENT" && quote.sentAt
                ? Math.floor(
                    // eslint-disable-next-line react-hooks/purity
                    (Date.now() - new Date(quote.sentAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;
            return (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="bg-background border border-border rounded-lg px-4.5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {quote.client.name} — {quote.title}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {formatDate(quote.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className="text-sm font-medium font-mono">
                    {currency.format(total)}
                  </span>
                  {staleDays !== null && staleDays >= 7 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning-fg">
                      {staleDays} 天未回覆
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full ${statusTone[quote.status]}`}
                  >
                    {statusLabel[quote.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <Pagination currentPage={page} totalCount={totalCount} pageSize={PAGE_SIZE} buildHref={pageHref} />
        </>
      )}
    </div>
  );
}
