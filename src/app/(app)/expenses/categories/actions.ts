"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createCategoryAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("請輸入分類名稱");
  }

  await prisma.expenseCategory.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name },
    update: {},
  });

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
}

export async function deleteCategoryAction(categoryId: string) {
  const userId = await requireUserId();

  await prisma.expenseCategory.deleteMany({ where: { id: categoryId, userId } });

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
}
