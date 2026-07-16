"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

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
