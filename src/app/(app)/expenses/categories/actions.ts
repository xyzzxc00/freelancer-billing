"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

export async function createCategoryAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "請輸入分類名稱" };
  }

  try {
    await prisma.expenseCategory.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
  } catch (err) {
    console.error("新增支出分類失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
  return { success: "已新增分類" };
}

export async function renameExpenseCategoryAction(
  categoryId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "請輸入分類名稱" };

  try {
    await prisma.expenseCategory.updateMany({
      where: { id: categoryId, userId },
      data: { name },
    });
  } catch {
    return { error: "這個名稱已存在" };
  }

  revalidatePath("/expenses/categories");
  return { success: "已更新" };
}

export async function deleteCategoryAction(categoryId: string) {
  const userId = await requireUserId();

  try {
    await prisma.expenseCategory.deleteMany({ where: { id: categoryId, userId } });
  } catch (err) {
    console.error("刪除支出分類失敗:", err);
    redirectWithToast("/expenses/categories", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
}

export async function mergeExpenseCategoryAction(
  fromId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const toId = String(formData.get("toId") ?? "").trim();

  if (!toId) return { error: "請選擇要合併到的分類" };

  const [from, to] = await Promise.all([
    prisma.expenseCategory.findFirst({ where: { id: fromId, userId } }),
    prisma.expenseCategory.findFirst({ where: { id: toId, userId } }),
  ]);
  if (!from || !to) return { error: "找不到分類" };

  try {
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { categoryId: fromId, userId },
        data: { categoryId: toId },
      }),
      prisma.recurringExpense.updateMany({
        where: { categoryId: fromId, userId },
        data: { categoryId: toId },
      }),
      prisma.expenseCategory.deleteMany({ where: { id: fromId, userId } }),
    ]);
  } catch (err) {
    console.error("合併支出分類失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/expenses/categories");
  revalidatePath("/expenses");
  return { success: `已將「${from.name}」的記錄合併至「${to.name}」並刪除` };
}
