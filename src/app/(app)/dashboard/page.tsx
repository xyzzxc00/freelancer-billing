import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

import { currency, formatDate } from "@/lib/currency";

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

const avatarTones = [
  "bg-[#FAECE7] text-[#712B13]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#FAEEDA] text-[#633806]",
  "bg-[#FBEAF0] text-[#72243E]",
];

// ── Stats ────────────────────────────────────────────────────────────────────

async function Stats() {
  const userId = await requireUserId();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [incomeThisMonth, expenseThisMonth, receivables] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", occurredAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", occurredAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.receivable.findMany({
      where: { userId, status: "PENDING" },
      select: { amount: true, dueDate: true },
    }),
  ]);

  const monthIncome = Number(incomeThisMonth._sum.amount ?? 0);
  const monthExpense = Number(expenseThisMonth._sum.amount ?? 0);
  const pendingTotal = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const overdueTotal = receivables
    .filter((r) => r.dueDate && r.dueDate < now)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <div className="bg-surface rounded-lg p-4">
        <p className="text-xs text-foreground-muted mb-1.5">本月收入</p>
        <p className="text-xl font-medium">{currency.format(monthIncome)}</p>
      </div>
      <div className="bg-surface rounded-lg p-4">
        <p className="text-xs text-foreground-muted mb-1.5">本月支出</p>
        <p className="text-xl font-medium">{currency.format(monthExpense)}</p>
      </div>
      <div className="bg-surface rounded-lg p-4">
        <p className="text-xs text-foreground-muted mb-1.5">本月淨收入</p>
        <p className={`text-xl font-medium ${monthIncome - monthExpense < 0 ? "text-[color:var(--danger-fg)]" : ""}`}>
          {currency.format(monthIncome - monthExpense)}
        </p>
      </div>
      <div className="bg-surface rounded-lg p-4">
        <p className="text-xs text-foreground-muted mb-1.5">待收款</p>
        <p className="text-xl font-medium text-[color:var(--warning-fg)]">
          {currency.format(pendingTotal)}
        </p>
        {overdueTotal > 0 && (
          <p className="text-xs text-[color:var(--danger-fg)] mt-0.5">
            逾期 {currency.format(overdueTotal)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Recent Quotes ─────────────────────────────────────────────────────────────

async function RecentQuotes() {
  const userId = await requireUserId();

  const recentQuotes = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { client: true, items: true },
  });

  return (
    <>
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-lg font-medium">近期報價單</h2>
        <Link href="/quotes/new" className="text-sm text-accent hover:underline">
          + 新增報價單
        </Link>
      </div>

      {recentQuotes.length === 0 ? (
        <p className="text-sm text-foreground-muted mb-7">還沒有報價單。</p>
      ) : (
        <div className="flex flex-col gap-2 mb-7">
          {recentQuotes.map((quote) => {
            const total = quote.items.reduce(
              (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
              0
            );
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
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-medium font-mono">
                    {currency.format(total)}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${statusTone[quote.status]}`}>
                    {statusLabel[quote.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Clients ───────────────────────────────────────────────────────────────────

async function Clients() {
  const userId = await requireUserId();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <>
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-lg font-medium">客戶</h2>
        <Link href="/clients" className="text-sm text-foreground-muted hover:text-foreground">
          查看全部
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-foreground-muted">還沒有客戶資料。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {clients.map((client, i) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="border border-border rounded-lg p-3.5 text-center hover:bg-surface transition-colors"
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
    </>
  );
}

// ── Onboarding (needs both quotes + clients to decide visibility) ──────────────

async function Onboarding() {
  const userId = await requireUserId();

  const [quoteCount, clientCount] = await Promise.all([
    prisma.quote.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
  ]);

  if (quoteCount > 0 || clientCount > 0) return null;

  return (
    <div className="border border-border rounded-lg p-5 mb-8">
      <h2 className="text-base font-medium mb-1">歡迎使用接案帳本 👋</h2>
      <p className="text-sm text-foreground-muted mb-4">
        三個步驟就能開出第一張報價單，跟著做做看：
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/clients/new" className="flex items-center gap-3 group">
          <span className="w-6 h-6 shrink-0 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium">
            1
          </span>
          <span className="text-sm group-hover:text-accent">新增你的第一個客戶</span>
        </Link>
        <Link href="/quotes/new" className="flex items-center gap-3 group">
          <span className="w-6 h-6 shrink-0 rounded-full bg-surface text-foreground-muted flex items-center justify-center text-xs font-medium">
            2
          </span>
          <span className="text-sm group-hover:text-accent">建立報價單，產生連結給客戶線上接受</span>
        </Link>
        <Link href="/income/new" className="flex items-center gap-3 group">
          <span className="w-6 h-6 shrink-0 rounded-full bg-surface text-foreground-muted flex items-center justify-center text-xs font-medium">
            3
          </span>
          <span className="text-sm group-hover:text-accent">記一筆收入或支出，年底報表自動彙整</span>
        </Link>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface rounded-lg p-4 animate-pulse">
          <div className="h-3 w-16 bg-foreground-muted/20 rounded mb-3" />
          <div className="h-6 w-24 bg-foreground-muted/20 rounded" />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border border-border rounded-lg px-4 py-3 animate-pulse">
          <div className="h-4 w-48 bg-foreground-muted/20 rounded mb-2" />
          <div className="h-3 w-32 bg-foreground-muted/20 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>

      <Suspense fallback={<CardsSkeleton count={3} />}>
        <RecentQuotes />
      </Suspense>

      <Suspense fallback={<CardsSkeleton count={4} />}>
        <Clients />
      </Suspense>
    </div>
  );
}
