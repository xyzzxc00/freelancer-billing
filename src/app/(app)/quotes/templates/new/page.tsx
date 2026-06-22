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
    take: 4,
    include: { items: true },
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
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
          itemsLabel="你的範本"
          steps={[
            "把常接的案子拆成項目，存成一個範本",
            "開新報價單時從下拉選單一鍵套用",
            "需要微調的部分再手動修改單價或數量就好",
          ]}
        >
          {existingTemplates.length > 0 &&
            existingTemplates.map((t) => {
              const total = t.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <div
                  key={t.id}
                  className="border border-border rounded-md p-3 flex items-center justify-between gap-3"
                >
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
