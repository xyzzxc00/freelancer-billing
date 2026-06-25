import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteTemplateAction } from "./actions";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default async function TemplatesPage() {
  const userId = await requireUserId();

  const templates = await prisma.quoteTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-lg">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">報價單範本</h1>
          <Link href="/quotes/templates/new" className="text-sm text-accent hover:underline">
            + 新增範本
          </Link>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-foreground-muted py-12 text-center">
            還沒有範本，建一個常用的項目組合，下次開報價單可以一鍵帶入。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {templates.map((template) => {
              const total = template.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              const deleteAction = deleteTemplateAction.bind(null, template.id);
              return (
                <div key={template.id} className="border border-border rounded-lg px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{template.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-foreground-muted">
                        {currency.format(total)}
                      </span>
                      <Link
                        href={`/quotes/templates/${template.id}`}
                        className="text-sm text-foreground-muted hover:text-foreground"
                      >
                        編輯
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteAction}
                        confirmMessage="確定要刪除這個範本嗎？此操作無法復原。"
                        successMessage="已刪除範本"
                        className="text-sm text-foreground-muted hover:text-[color:var(--danger-fg)]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    {template.items.map((item) => item.name).join("、")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
