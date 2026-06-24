import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ClientForm } from "@/components/ClientForm";
import { updateClientAction, deleteClientAction } from "../actions";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已送出",
  ACCEPTED: "已接受",
  REJECTED: "已拒絕",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const updateAction = updateClientAction.bind(null, client.id);
  const deleteAction = deleteClientAction.bind(null, client.id);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-md">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-medium">編輯客戶</h1>
          <Link href="/clients" className="text-sm text-foreground-muted hover:text-foreground">
            返回
          </Link>
        </div>

        <ClientForm
          action={updateAction}
          defaultName={client.name}
          defaultContact={client.contact ?? ""}
          defaultNote={client.note ?? ""}
          submitLabel="儲存變更"
        />

        <div className="mt-2">
          <ConfirmDeleteButton
            action={deleteAction}
            confirmMessage="確定要刪除這位客戶嗎？此操作無法復原。"
            successMessage="已刪除客戶"
            className="text-sm text-[color:var(--danger-fg)] hover:underline"
            label="刪除這位客戶"
          />
        </div>

        <h2 className="text-base font-medium mt-8 mb-3">案件歷史</h2>
        {client.quotes.length === 0 ? (
          <p className="text-sm text-foreground-muted">這位客戶還沒有報價單。</p>
        ) : (
          <div className="flex flex-col gap-2">
            {client.quotes.map((quote) => {
              const total = quote.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
                0
              );
              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
                >
                  <p className="text-sm font-medium truncate min-w-0">{quote.title}</p>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-mono">
                      {new Intl.NumberFormat("zh-TW", {
                        style: "currency",
                        currency: "TWD",
                        maximumFractionDigits: 0,
                      }).format(total)}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface text-foreground-muted">
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
