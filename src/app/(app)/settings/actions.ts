"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR } from "@/lib/action-state";

export async function updateProfileAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length > 100) {
    redirectWithToast("/settings", "名稱請控制在 100 字以內", "error");
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { name: name || null },
    });
  } catch (err) {
    console.error("更新個人資料失敗:", err);
    redirectWithToast("/settings", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/", "layout");
  redirectWithToast("/settings", "已更新個人資料");
}

export async function updateBankInfoAction(formData: FormData) {
  const userId = await requireUserId();

  const bankName = String(formData.get("bankName") ?? "").trim() || null;
  const bankBranch = String(formData.get("bankBranch") ?? "").trim() || null;
  const bankAccount = String(formData.get("bankAccount") ?? "").trim() || null;
  const bankAccountHolder = String(formData.get("bankAccountHolder") ?? "").trim() || null;

  const tooLong = [bankName, bankBranch, bankAccount, bankAccountHolder].some(
    (v) => v !== null && v.length > 100
  );
  if (tooLong) {
    redirectWithToast("/settings", "每個欄位請控制在 100 字以內", "error");
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { bankName, bankBranch, bankAccount, bankAccountHolder },
    });
  } catch (err) {
    console.error("更新收款帳戶失敗:", err);
    redirectWithToast("/settings", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/settings");
  redirectWithToast("/settings", "已更新收款帳戶");
}
