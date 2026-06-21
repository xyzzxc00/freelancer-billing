import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { QuoteForm } from "@/components/QuoteForm";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createQuoteAction } from "../actions";

export default async function NewQuotePage() {
  const userId = await requireUserId();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <TopNav active="報價單" />

      <div className="px-6 py-6 max-w-lg">
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
          <QuoteForm clients={clients} action={createQuoteAction} />
        )}
      </div>
    </div>
  );
}
