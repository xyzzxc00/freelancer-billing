import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { IncomeForm } from "@/components/IncomeForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { updateIncomeAction, deleteIncomeAction } from "../actions";

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [transaction, categories] = await Promise.all([
    prisma.transaction.findFirst({
      where: { id, userId, type: "INCOME" },
      include: { incomeCategory: true },
    }),
    prisma.incomeCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!transaction) notFound();

  const updateAction = updateIncomeAction.bind(null, id);
  const deleteAction = deleteIncomeAction.bind(null, id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-xl">
      <div className="border border-border rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">編輯收入</h1>
        <Link href="/income" className="text-sm text-foreground-muted hover:text-foreground">
          取消
        </Link>
      </div>

      <IncomeForm
        action={updateAction}
        categories={categories}
        categoriesHref="/income/categories"
        defaultAmount={String(transaction.amount)}
        defaultCategoryId={transaction.incomeCategoryId ?? undefined}
        defaultOccurredAt={transaction.occurredAt.toISOString().slice(0, 10)}
        defaultNote={transaction.note ?? undefined}
      />

      <div className="mt-4">
        <ConfirmDeleteButton
          action={deleteAction}
          confirmMessage="確定要刪除這筆收入嗎？此操作無法復原。"
          successMessage="已刪除收入"
          className="text-sm text-[color:var(--danger-fg)] hover:underline"
          label="刪除這筆收入"
        />
      </div>
      </div>
    </div>
  );
}
