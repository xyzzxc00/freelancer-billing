import Link from "next/link";
import { QuoteForm } from "@/components/QuoteForm";
import { TipPanel } from "@/components/TipPanel";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createQuoteAction } from "../actions";

export default async function NewQuotePage() {
  const userId = await requireUserId();

  const [clients, templates] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.quoteTemplate.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const templateOptions = templates.map((t) => ({
    id: t.id,
    name: t.name,
    items: t.items.map((item) => ({
      name: item.name,
      unitPrice: String(item.unitPrice),
      quantity: String(item.quantity),
    })),
  }));

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增報價單</h1>
            <Link href="/quotes" className="text-sm text-foreground-muted hover:text-foreground">
              取消
            </Link>
          </div>

          {clients.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              請先到
              <Link href="/clients/new" className="text-accent hover:underline mx-1">
                新增客戶
              </Link>
              ，才能建立報價單。
            </p>
          ) : (
            <QuoteForm clients={clients} action={createQuoteAction} templates={templateOptions} />
          )}
        </div>

        <TipPanel
          title="稅務模式怎麼選？"
          description="報價單的稅務模式決定客戶看到的金額與你實際入帳的金額，建立前確認清楚可以避免糾紛。"
          steps={[
            "未稅：直接報原價，適合 B2B 或雙方自行處理稅務的情況",
            "營業稅 5%：開立統一發票時使用，客戶支付含稅金額",
            "勞務報酬 10%：個人接案最常見，平台或客戶代扣 10% 所得稅與二代健保補充保費",
          ]}
        />
      </div>
    </div>
  );
}
