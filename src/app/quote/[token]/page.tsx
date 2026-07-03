import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateTax } from "@/lib/tax";
import { QuoteViewTracker } from "@/components/QuoteViewTracker";
import { QuoteResponseActions } from "@/components/QuoteResponseActions";
import { respondToQuoteAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatDate(date: Date) {
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SENT:     { label: "待您回覆",  className: "bg-amber-100 text-amber-800" },
  ACCEPTED: { label: "已接受",    className: "bg-green-100 text-green-800" },
  REJECTED: { label: "已拒絕",    className: "bg-red-100 text-red-800" },
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: {
      client: true,
      profile: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quote || quote.status === "DRAFT") {
    notFound();
  }

  const subtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );
  const breakdown = calculateTax(subtotal, quote.taxMode);

  const acceptAction = respondToQuoteAction.bind(null, token, "ACCEPTED");
  const rejectAction = respondToQuoteAction.bind(null, token, "REJECTED");

  const status = statusConfig[quote.status];
  const quoteDate = quote.sentAt ?? quote.createdAt;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <QuoteViewTracker token={token} />

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {quote.profile.name ?? quote.profile.email} 提供的報價單
        </span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
            {status.label}
          </span>
          <a
            href={`/quote/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md px-3 py-1.5 transition-colors"
          >
            PDF
          </a>
        </div>
      </div>

      {/* Document */}
      <div className="flex-1 flex justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Document header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">報價單</p>
                <h1 className="text-2xl font-semibold text-gray-900">{quote.title}</h1>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400 mb-0.5">報價日期</p>
                <p className="text-sm text-gray-700 font-medium">{formatDate(quoteDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">提供方</p>
                <p className="text-sm font-medium text-gray-800">
                  {quote.profile.name ?? quote.profile.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">給</p>
                <p className="text-sm font-medium text-gray-800">{quote.client.name}</p>
              </div>
              {quote.expiresAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">有效期限</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(quote.expiresAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="px-4 sm:px-8 py-6">
            {/* 手機：卡片 */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {quote.items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-800 break-words">{item.name}</span>
                    <span className="text-sm font-mono text-gray-800 shrink-0">
                      {currency.format(Number(item.unitPrice) * Number(item.quantity))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Number(item.quantity)} × {currency.format(Number(item.unitPrice))}
                  </p>
                </div>
              ))}
            </div>

            {/* 桌機：表格 */}
            <table className="hidden sm:table w-full text-sm" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium w-1/2">項目</th>
                  <th className="text-center pb-2 font-medium w-1/6">數量</th>
                  <th className="text-right pb-2 font-medium w-1/6">單價</th>
                  <th className="text-right pb-2 font-medium w-1/6">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-800 break-words pr-4">{item.name}</td>
                    <td className="py-3 text-center text-gray-600">{Number(item.quantity)}</td>
                    <td className="py-3 text-right font-mono text-gray-600">
                      {currency.format(Number(item.unitPrice))}
                    </td>
                    <td className="py-3 text-right font-mono text-gray-800">
                      {currency.format(Number(item.unitPrice) * Number(item.quantity))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="px-8 pb-6 border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 mb-2">備註</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Totals */}
          <div className="px-8 pb-8">
            <div className="ml-auto w-full sm:w-72 border-t border-gray-200 pt-4 flex flex-col gap-2">
              {breakdown.clientLines.map((line) => (
                <div key={line.label} className="flex justify-between text-sm text-gray-500">
                  <span>{line.label}</span>
                  <span className="font-mono">{currency.format(line.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-base text-gray-900 pt-2 border-t border-gray-200 mt-1">
                <span>應付金額</span>
                <span className="font-mono">{currency.format(breakdown.clientTotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank info */}
          {(quote.profile.bankName || quote.profile.bankAccount) && (
            <div className="px-8 pb-8 border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 mb-2">收款帳戶</p>
              <div className="text-sm text-gray-700 flex flex-col gap-1">
                {quote.profile.bankName && (
                  <p>
                    銀行：{quote.profile.bankName}
                    {quote.profile.bankBranch ? ` ${quote.profile.bankBranch}` : ""}
                  </p>
                )}
                {quote.profile.bankAccount && <p>帳號：{quote.profile.bankAccount}</p>}
                {quote.profile.bankAccountHolder && <p>戶名：{quote.profile.bankAccountHolder}</p>}
              </div>
            </div>
          )}

          {/* Action */}
          {quote.status === "SENT" && (
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">請確認報價內容後選擇接受或拒絕</p>
              <QuoteResponseActions acceptAction={acceptAction} rejectAction={rejectAction} />
            </div>
          )}

          {quote.status !== "SENT" && (
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">此報價單狀態：{status.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
