"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-state";

export async function createIncomeCategoryAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "請輸入分類名稱" };
  }

  await prisma.incomeCategory.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name },
    update: {},
  });

  revalidatePath("/income/categories");
  revalidatePath("/income");
  return { success: "已新增分類" };
}

export async function deleteIncomeCategoryAction(categoryId: string) {
  const userId = await requireUserId();

  await prisma.incomeCategory.deleteMany({ where: { id: categoryId, userId } });

  revalidatePath("/income/categories");
  revalidatePath("/income");
}
