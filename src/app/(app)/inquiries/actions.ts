"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR } from "@/lib/action-state";

// 一鍵從詢價開報價單：同名客戶直接沿用（避免同一個詢價人被建成多筆客戶），
// 沒有才新建，再帶著客戶跳到新增報價單頁
export async function createQuoteFromInquiryAction(inquiryId: string) {
  const userId = await requireUserId();

  const inquiry = await prisma.inquiry.findFirst({ where: { id: inquiryId, userId } });
  if (!inquiry) {
    redirectWithToast("/inquiries", GENERIC_ACTION_ERROR, "error");
  }

  let client = await prisma.client.findFirst({
    where: { userId, name: inquiry.name },
  });

  if (!client) {
    try {
      client = await prisma.client.create({
        data: {
          userId,
          name: inquiry.name,
          contact: inquiry.contact,
          note: `來自接案頁詢價：${inquiry.message}`.slice(0, 1000),
        },
      });
    } catch (err) {
      console.error("從詢價建立客戶失敗:", err);
      redirectWithToast("/inquiries", GENERIC_ACTION_ERROR, "error");
    }
    revalidatePath("/clients");
  }

  redirectWithToast(`/quotes/new?clientId=${client.id}`, "已帶入詢價客戶");
}

export async function deleteInquiryAction(inquiryId: string) {
  const userId = await requireUserId();

  try {
    await prisma.inquiry.deleteMany({ where: { id: inquiryId, userId } });
  } catch (err) {
    console.error("刪除詢價失敗:", err);
    return;
  }

  revalidatePath("/inquiries");
}
