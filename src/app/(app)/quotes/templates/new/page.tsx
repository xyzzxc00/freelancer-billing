import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TemplateItemsEditor } from "@/components/TemplateItemsEditor";
import { TipPanel } from "@/components/TipPanel";
import { createTemplateAction } from "../actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function NewTemplatePage() {
  const userId = await requireUserId();

  const existingTemplates = await prisma.quoteTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { items: true },
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        <div className="max-w-lg w-full">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-medium">新增範本</h1>
            <Link
              href="/quotes/templates"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              取消
            </Link>
          </div>

          <TemplateItemsEditor action={createTemplateAction} />
        </div>

        <TipPanel
          title="常用項目組合存成範本"
          description="開新報價單時可以一鍵套用，不用每次重新輸入相同的項目跟單價。"
        >
          {existingTemplates.length > 0 &&
            existingTemplates.map((t) => {
              const total = t.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <span className="text-xs font-mono text-foreground-muted shrink-0">
                    {currency.format(total)}
                  </span>
                </div>
              );
            })}
        </TipPanel>
      </div>
    </div>
  );
}
