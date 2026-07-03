"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function updateProfileAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { name: name || null },
    });
  } catch (err) {
    console.error("更新個人資料失敗:", err);
    return;
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function updateBankInfoAction(formData: FormData) {
  const userId = await requireUserId();

  const bankName = String(formData.get("bankName") ?? "").trim() || null;
  const bankBranch = String(formData.get("bankBranch") ?? "").trim() || null;
  const bankAccount = String(formData.get("bankAccount") ?? "").trim() || null;
  const bankAccountHolder = String(formData.get("bankAccountHolder") ?? "").trim() || null;

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { bankName, bankBranch, bankAccount, bankAccountHolder },
    });
  } catch (err) {
    console.error("更新收款帳戶失敗:", err);
    return;
  }

  revalidatePath("/settings");
}
