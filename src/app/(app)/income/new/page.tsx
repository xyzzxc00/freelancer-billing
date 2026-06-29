import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { IncomeForm } from "@/components/IncomeForm";
import { createIncomeAction } from "../actions";

export default async function NewIncomePage() {
  const userId = await requireUserId();

  const categories = await prisma.incomeCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-7xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">新增收入</h1>
        <Link href="/income" className="text-sm text-foreground-muted hover:text-foreground">
          取消
        </Link>
      </div>

      <IncomeForm
        action={createIncomeAction}
        categories={categories}
        categoriesHref="/income/categories"
      />
    </div>
  );
}
