import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateTax } from "@/lib/tax";
import { respondToQuoteAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const statusLabel: Record<string, string> = {
  DRAFT: "草稿（尚未送出）",
  SENT: "待回覆",
  ACCEPTED: "已接受",
  REJECTED: "已拒絕",
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

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <p className="text-sm text-foreground-muted mb-1">
          {quote.profile.name ?? quote.profile.email} 提供的報價單
        </p>
        <h1 className="text-xl font-medium mb-1">{quote.title}</h1>
        <p className="text-sm text-foreground-muted mb-6">給 {quote.client.name}</p>

        <div className="border border-border rounded-lg p-5 mb-6">
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
          <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
            {breakdown.lines.map((line) => (
              <div key={line.label} className="flex justify-between text-foreground-muted">
                <span>{line.label}</span>
                <span className="font-mono">{currency.format(line.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-medium text-base pt-1">
              <span>應付金額</span>
              <span className="font-mono">{currency.format(breakdown.clientTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-muted">
            目前狀態：{statusLabel[quote.status]}
          </span>
          {quote.status === "SENT" && (
            <div className="flex gap-2">
              <form action={rejectAction}>
                <button
                  type="submit"
                  className="border border-border rounded-md px-4 py-2 text-sm hover:bg-surface"
                >
                  拒絕
                </button>
              </form>
              <form action={acceptAction}>
                <button
                  type="submit"
                  className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
                >
                  接受報價
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
