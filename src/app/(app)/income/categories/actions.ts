"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

export async function createIncomeCategoryAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "請輸入分類名稱" };
  }

  try {
    await prisma.incomeCategory.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
  } catch (err) {
    console.error("新增收入分類失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income/categories");
  revalidatePath("/income");
  return { success: "已新增分類" };
}

export async function renameIncomeCategoryAction(
  categoryId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "請輸入分類名稱" };

  try {
    await prisma.incomeCategory.updateMany({
      where: { id: categoryId, userId },
      data: { name },
    });
  } catch {
    return { error: "這個名稱已存在" };
  }

  revalidatePath("/income/categories");
  return { success: "已更新" };
}

export async function deleteIncomeCategoryAction(categoryId: string) {
  const userId = await requireUserId();

  try {
    await prisma.incomeCategory.deleteMany({ where: { id: categoryId, userId } });
  } catch (err) {
    console.error("刪除收入分類失敗:", err);
    redirectWithToast("/income/categories", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/income/categories");
  revalidatePath("/income");
}

export async function mergeIncomeCategoryAction(
  fromId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  const toId = String(formData.get("toId") ?? "").trim();

  if (!toId) return { error: "請選擇要合併到的分類" };

  const [from, to] = await Promise.all([
    prisma.incomeCategory.findFirst({ where: { id: fromId, userId } }),
    prisma.incomeCategory.findFirst({ where: { id: toId, userId } }),
  ]);
  if (!from || !to) return { error: "找不到分類" };

  try {
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { incomeCategoryId: fromId, userId },
        data: { incomeCategoryId: toId },
      }),
      prisma.recurringIncome.updateMany({
        where: { categoryId: fromId, userId },
        data: { categoryId: toId },
      }),
      prisma.incomeCategory.deleteMany({ where: { id: fromId, userId } }),
    ]);
  } catch (err) {
    console.error("合併收入分類失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/income/categories");
  revalidatePath("/income");
  return { success: `已將「${from.name}」的記錄合併至「${to.name}」並刪除` };
}
