import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

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

export default async function QuotesPage() {
  const userId = await requireUserId();

  const quotes = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { client: true, items: true },
  });

  return (
    <div className="px-6 py-6">
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

        {quotes.length === 0 ? (
          <p className="text-sm text-foreground-muted py-12 text-center">
            還沒有報價單，先新增一個吧。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {quotes.map((quote) => {
              const total = quote.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="bg-background border border-border rounded-lg px-4.5 py-3.5 flex items-center justify-between hover:bg-surface transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {quote.client.name} — {quote.title}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {new Date(quote.createdAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium font-mono">
                      {currency.format(total)}
                    </span>
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
        )}
    </div>
  );
}
