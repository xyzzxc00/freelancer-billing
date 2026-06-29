import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { updateExpenseAction, deleteExpenseAction } from "../actions";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [transaction, categories] = await Promise.all([
    prisma.transaction.findFirst({
      where: { id, userId, type: "EXPENSE" },
      include: { expenseCategory: true },
    }),
    prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!transaction) notFound();

  const updateAction = updateExpenseAction.bind(null, id);
  const deleteAction = deleteExpenseAction.bind(null, id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-2xl">
      <div className="border border-border rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">編輯支出</h1>
        <Link href="/expenses" className="text-sm text-foreground-muted hover:text-foreground">
          取消
        </Link>
      </div>

      <ExpenseForm
        action={updateAction}
        categories={categories}
        categoriesHref="/expenses/categories"
        defaultAmount={String(transaction.amount)}
        defaultCategoryId={transaction.categoryId ?? undefined}
        defaultOccurredAt={transaction.occurredAt.toISOString().slice(0, 10)}
        defaultNote={transaction.note ?? undefined}
      />

      <div className="mt-4">
        <ConfirmDeleteButton
          action={deleteAction}
          confirmMessage="確定要刪除這筆支出嗎？此操作無法復原。"
          successMessage="已刪除支出"
          className="text-sm text-[color:var(--danger-fg)] hover:underline"
          label="刪除這筆支出"
        />
      </div>
      </div>
    </div>
  );
}
