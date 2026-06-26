import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QuoteForm } from "@/components/QuoteForm";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { calculateTax } from "@/lib/tax";
import {
  updateQuoteItemsAction,
  markQuoteSentAction,
  acceptQuoteAction,
  rejectQuoteAction,
  deleteQuoteAction,
} from "../actions";

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

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const quote = await prisma.quote.findFirst({
    where: { id, userId },
    include: { client: true, items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quote) {
    notFound();
  }

  const subtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );
  const breakdown = calculateTax(subtotal, quote.taxMode);

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/quote/${quote.shareToken}`;

  const updateAction = updateQuoteItemsAction.bind(null, quote.id);
  const sentAction = markQuoteSentAction.bind(null, quote.id);
  const acceptAction = acceptQuoteAction.bind(null, quote.id);
  const rejectAction = rejectQuoteAction.bind(null, quote.id);
  const deleteAction = deleteQuoteAction.bind(null, quote.id);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-lg">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h1 className="text-lg font-medium min-w-0 truncate">
            {quote.client.name} — {quote.title}
          </h1>
          <Link
            href="/quotes"
            className="text-sm text-foreground-muted hover:text-foreground shrink-0"
          >
            返回
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <p className="text-sm text-foreground-muted">{statusLabel[quote.status]}</p>
          {quote.status === "SENT" && quote.sentAt && (() => {
            // eslint-disable-next-line react-hooks/purity
            const days = Math.floor((Date.now() - new Date(quote.sentAt).getTime()) / (1000 * 60 * 60 * 24));
            return days >= 7 ? (
              <>
                <span className="text-foreground-muted">·</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning-fg">
                  已送出 {days} 天未回覆
                </span>
              </>
            ) : null;
          })()}
          {quote.viewedAt && (
            <>
              <span className="text-foreground-muted">·</span>
              <span className="text-xs text-foreground-muted">
                客戶已於 {new Date(quote.viewedAt).toLocaleDateString("zh-TW")} 查看
              </span>
            </>
          )}
          <span className="text-foreground-muted">·</span>
          <a href={`/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
            預覽 PDF
          </a>
        </div>

        <div className="mb-6">
          <label className="text-sm text-foreground-muted block mb-1.5">分享連結（給客戶看）</label>
          <CopyLinkButton url={shareUrl} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {quote.status === "DRAFT" && (
            <form action={sentAction}>
              <button
                type="submit"
                className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
              >
                標記為已送出
              </button>
            </form>
          )}
          {quote.status === "SENT" && (
            <>
              <form action={acceptAction}>
                <button
                  type="submit"
                  className="bg-success-bg text-success-fg rounded-md px-4 py-2 text-sm font-medium"
                >
                  標記為已接受 → 轉入待收款
                </button>
              </form>
              <form action={rejectAction}>
                <button
                  type="submit"
                  className="border border-border rounded-md px-4 py-2 text-sm hover:bg-surface"
                >
                  標記為已拒絕
                </button>
              </form>
            </>
          )}
          <div className="self-center">
            <ConfirmDeleteButton
              action={deleteAction}
              confirmMessage="確定要刪除這張報價單嗎？此操作無法復原。"
              successMessage="已刪除報價單"
              className="text-sm text-[color:var(--danger-fg)] hover:underline px-1"
            />
          </div>
        </div>

        {quote.status === "DRAFT" ? (
          <QuoteForm
            clients={[{ id: quote.clientId, name: quote.client.name }]}
            action={updateAction}
            defaultClientId={quote.clientId}
            defaultTitle={quote.title}
            defaultTaxMode={quote.taxMode}
            defaultItems={quote.items.map((item) => ({
              name: item.name,
              unitPrice: String(item.unitPrice),
              quantity: String(item.quantity),
            }))}
            showClientField={false}
          />
        ) : (
          <div>
            <div className="flex flex-col gap-2 mb-4">
              {quote.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {Number(item.quantity)}
                  </span>
                  <span className="font-mono">
                    {currency.format(Number(item.unitPrice) * Number(item.quantity))}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm">
              {breakdown.clientLines.map((line) => (
                <div key={line.label} className="flex justify-between text-foreground-muted">
                  <span>{line.label}</span>
                  <span className="font-mono">{currency.format(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
                <span>客戶看到金額</span>
                <span className="font-mono">{currency.format(breakdown.clientTotal)}</span>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 flex flex-col gap-1.5 text-sm mt-2">
              {breakdown.freelancerLines.map((line) => (
                <div key={line.label} className="flex justify-between text-foreground-muted">
                  <span>{line.label}</span>
                  <span className="font-mono">{currency.format(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-1.5 border-t border-border mt-1">
                <span>自己實拿金額</span>
                <span className="font-mono">{currency.format(breakdown.freelancerNet)}</span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
