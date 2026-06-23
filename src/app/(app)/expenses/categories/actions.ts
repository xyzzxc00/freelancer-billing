"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-state";

export async function createCategoryAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "請輸入分類名稱" };
  }

  await prisma.expenseCategory.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name },
    update: {},
  });

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
  return { success: "已新增分類" };
}

export async function deleteCategoryAction(categoryId: string) {
  const userId = await requireUserId();

  await prisma.expenseCategory.deleteMany({ where: { id: categoryId, userId } });

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
}
