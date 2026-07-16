"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR } from "@/lib/action-state";

// 避免接案頁網址跟站內既有路由（或未來會用到的路由）撞名
const RESERVED_SLUGS = new Set([
  "dashboard", "clients", "quotes", "quote", "income", "expenses", "receivables",
  "reports", "settings", "feedback", "transactions", "inquiries", "login", "signup",
  "privacy", "guides", "api", "p", "auth", "forgot-password", "reset-password",
  "llms.txt", "sitemap.xml", "robots.txt", "manifest.webmanifest",
]);

const slugSchema = z
  .string()
  .min(3, "網址代稱至少 3 個字")
  .max(30, "網址代稱最多 30 個字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "只能用小寫英文字母、數字與連字號（-），且不能開頭或結尾是連字號");

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

export async function updatePublicPageAction(formData: FormData) {
  const userId = await requireUserId();

  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const services = String(formData.get("services") ?? "").trim() || null;

  let slug: string | null = null;
  if (slugRaw) {
    const parsed = slugSchema.safeParse(slugRaw);
    if (!parsed.success) {
      redirectWithToast("/settings", parsed.error.issues[0].message, "error");
    }
    if (RESERVED_SLUGS.has(slugRaw)) {
      redirectWithToast("/settings", "這個網址代稱是系統保留字，請換一個", "error");
    }
    slug = slugRaw;
  }

  if (bio && bio.length > 1000) {
    redirectWithToast("/settings", "自我介紹請控制在 1000 字以內", "error");
  }
  if (services && services.length > 1000) {
    redirectWithToast("/settings", "服務項目請控制在 1000 字以內", "error");
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { slug, bio, services },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirectWithToast("/settings", "這個網址代稱已經有人使用了，請換一個", "error");
    }
    console.error("更新接案頁失敗:", err);
    redirectWithToast("/settings", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/settings");
  redirectWithToast("/settings", "已更新接案頁");
}
