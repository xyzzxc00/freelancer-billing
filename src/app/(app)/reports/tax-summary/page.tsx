import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { calculateTax, taxModeLabel, type TaxMode } from "@/lib/tax";
import { currency } from "@/lib/currency";

export default async function TaxSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const quotes = await prisma.quote.findMany({
    where: {
      userId,
      status: "ACCEPTED",
      taxMode: { not: "NONE" },
      respondedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    include: { client: true, items: true },
    orderBy: { respondedAt: "asc" },
  });

  const rows = quotes.map((q) => {
    const subtotal = q.items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
    const breakdown = calculateTax(subtotal, q.taxMode);
    const withholding = breakdown.freelancerLines.find((l) => l.label.includes("代扣"));
    const healthSupplement = breakdown.freelancerLines.find((l) => l.label.includes("健保"));
    return {
      id: q.id,
      clientName: q.client.name,
      title: q.title,
      date: q.respondedAt!,
      taxMode: q.taxMode,
      subtotal,
      withholding: withholding ? -withholding.amount : 0,
      healthSupplement: healthSupplement ? -healthSupplement.amount : 0,
      net: breakdown.freelancerNet,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      subtotal: acc.subtotal + r.subtotal,
      withholding: acc.withholding + r.withholding,
      healthSupplement: acc.healthSupplement + r.healthSupplement,
      net: acc.net + r.net,
    }),
    { subtotal: 0, withholding: 0, healthSupplement: 0, net: 0 }
  );

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium">報稅彙總</h1>
          <div className="flex gap-2 text-sm">
            <Link href={`/reports/tax-summary?year=${year - 1}`} className="text-foreground-muted hover:text-foreground">
              {year - 1}
            </Link>
            <span className="font-medium">{year}</span>
            <Link href={`/reports/tax-summary?year=${year + 1}`} className="text-foreground-muted hover:text-foreground">
              {year + 1}
            </Link>
          </div>
        </div>
        <a
          href={`/reports/tax-summary/export?year=${year}`}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          匯出 CSV
        </a>
      </div>
      <p className="text-xs text-foreground-muted mb-6">
        以報價「接受」日期彙整需課稅的委託報酬，僅供試算參考，正式申報請以扣繳憑單為準。
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted">這一年還沒有需要課稅的已接受報價。</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            <div className="bg-surface rounded-lg p-4">
              <p className="text-xs text-foreground-muted mb-1.5">委託報酬總額</p>
              <p className="text-xl font-medium">{currency.format(totals.subtotal)}</p>
            </div>
            <div className="bg-surface rounded-lg p-4">
              <p className="text-xs text-foreground-muted mb-1.5">代扣稅額合計</p>
              <p className="text-xl font-medium">{currency.format(totals.withholding)}</p>
            </div>
            <div className="bg-surface rounded-lg p-4">
              <p className="text-xs text-foreground-muted mb-1.5">二代健保合計</p>
              <p className="text-xl font-medium">{currency.format(totals.healthSupplement)}</p>
            </div>
            <div className="bg-surface rounded-lg p-4">
              <p className="text-xs text-foreground-muted mb-1.5">實拿金額合計</p>
              <p className="text-xl font-medium">{currency.format(totals.net)}</p>
            </div>
          </div>

          {/* 手機：卡片 */}
          <div className="sm:hidden flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.id} className="border border-border rounded-lg px-4 py-3">
                <p className="text-sm font-medium">{r.clientName} — {r.title}</p>
                <p className="text-xs text-foreground-muted mb-2">
                  {r.date.toLocaleDateString("zh-TW")} · {taxModeLabel[r.taxMode as TaxMode]}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-foreground-muted mb-0.5">總額</p>
                    <p className="font-mono">{currency.format(r.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-foreground-muted mb-0.5">實拿</p>
                    <p className="font-mono">{currency.format(r.net)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 桌機：表格 */}
          <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="bg-surface text-foreground-muted text-xs">
                  <th className="text-left px-3 py-2">客戶／報價</th>
                  <th className="text-left px-3 py-2 w-28">日期</th>
                  <th className="text-right px-3 py-2 w-28">報酬總額</th>
                  <th className="text-right px-3 py-2 w-24">代扣稅額</th>
                  <th className="text-right px-3 py-2 w-24">二代健保</th>
                  <th className="text-right px-3 py-2 w-28">實拿金額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 truncate">{r.clientName} — {r.title}</td>
                    <td className="px-3 py-2">{r.date.toLocaleDateString("zh-TW")}</td>
                    <td className="text-right px-3 py-2 font-mono">{currency.format(r.subtotal)}</td>
                    <td className="text-right px-3 py-2 font-mono">{currency.format(r.withholding)}</td>
                    <td className="text-right px-3 py-2 font-mono">{currency.format(r.healthSupplement)}</td>
                    <td className="text-right px-3 py-2 font-mono">{currency.format(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
