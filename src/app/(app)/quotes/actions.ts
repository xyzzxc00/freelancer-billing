"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { sendEmail } from "@/lib/email";
import type { TaxMode } from "@/lib/tax";
import type { ActionResult } from "@/lib/action-state";

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

interface ItemInput {
  name: string;
  unitPrice: number;
  quantity: number;
}

interface RawItem {
  name?: string;
  unitPrice?: string | number;
  quantity?: string | number;
}

type ParseItemsResult =
  | { ok: true; items: ItemInput[] }
  | { ok: false; error: string };

function parseItems(raw: string): ParseItemsResult {
  let parsed: RawItem[];
  try {
    parsed = JSON.parse(raw) as RawItem[];
  } catch {
    return { ok: false, error: "項目資料格式錯誤" };
  }

  // 完全空白的列（沒有名稱也沒有單價）直接忽略
  const rows = parsed.filter(
    (item) =>
      String(item.name ?? "").trim() !== "" ||
      String(item.unitPrice ?? "").trim() !== ""
  );

  if (rows.length === 0) {
    return { ok: false, error: "請至少新增一個項目" };
  }

  const items: ItemInput[] = [];
  for (const item of rows) {
    const name = String(item.name ?? "").trim();
    if (!name) {
      return { ok: false, error: "每個項目都要填寫名稱" };
    }
    const unitPrice = Number(item.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: `「${name}」的單價要填大於 0 的金額` };
    }
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: `「${name}」的數量要填大於 0 的數字` };
    }
    items.push({ name, unitPrice, quantity });
  }

  return { ok: true, items };
}

export async function createQuoteAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const clientId = String(formData.get("clientId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const taxMode = String(formData.get("taxMode") ?? "NONE") as TaxMode;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!clientId) {
    return { error: "請選擇客戶" };
  }
  if (!title) {
    return { error: "請填寫標題" };
  }
  const parsed = parseItems(String(formData.get("items") ?? "[]"));
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const items = parsed.items;

  const quote = await prisma.quote.create({
    data: {
      userId,
      clientId,
      title,
      taxMode,
      notes,
      items: {
        create: items.map((item, i) => ({
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/quotes");
  redirectWithToast(`/quotes/${quote.id}`, "已建立報價單");
}

export async function updateQuoteItemsAction(
  quoteId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const taxMode = String(formData.get("taxMode") ?? "NONE") as TaxMode;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) {
    return { error: "請填寫標題" };
  }
  const parsed = parseItems(String(formData.get("items") ?? "[]"));
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const items = parsed.items;

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId } });
  if (!quote) {
    return { error: "找不到報價單" };
  }

  await prisma.$transaction([
    prisma.quoteItem.deleteMany({ where: { quoteId } }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        title,
        taxMode,
        notes,
        items: {
          create: items.map((item, i) => ({
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            sortOrder: i,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/quotes/${quoteId}`);
  redirectWithToast(`/quotes/${quoteId}`, "已更新報價單");
}

export async function markQuoteSentAction(quoteId: string) {
  const userId = await requireUserId();

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId, status: "DRAFT" },
    include: { client: true, profile: true },
  });

  if (!quote) return;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "SENT", sentAt: new Date() },
  });

  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/quote/${quote.shareToken}`;
  const senderName = quote.profile.name ?? quote.profile.email;

  const clientEmail = extractEmail(quote.client.contact ?? "");
  if (clientEmail) {
    try {
      await sendEmail({
        to: clientEmail,
        subject: `${senderName} 提供了一份報價單給你：${quote.title}`,
        html: `<p>你好，</p><p>${senderName} 提供了一份報價單給你：<strong>${quote.title}</strong></p><p><a href="${shareUrl}">點此查看報價單並回覆</a></p>`,
      });
    } catch (err) {
      console.error("報價單通知信寄送失敗:", err);
    }
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");

  const toastMsg = clientEmail
    ? "已標記為送出，通知信已寄給客戶"
    : "已標記為送出（客戶聯絡方式未填 email，請手動通知）";
  redirectWithToast(`/quotes/${quoteId}`, toastMsg);
}

export async function acceptQuoteAction(quoteId: string) {
  const userId = await requireUserId();

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId },
    include: { items: true },
  });
  if (!quote) throw new Error("找不到報價單");

  const subtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
    prisma.receivable.upsert({
      where: { quoteId },
      create: { userId, quoteId, amount: subtotal },
      update: { amount: subtotal },
    }),
  ]);

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath("/income");
}

export async function rejectQuoteAction(quoteId: string) {
  const userId = await requireUserId();

  await prisma.quote.updateMany({
    where: { id: quoteId, userId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function deleteQuoteAction(quoteId: string) {
  const userId = await requireUserId();

  await prisma.quote.deleteMany({ where: { id: quoteId, userId } });

  revalidatePath("/quotes");
  redirect("/quotes");
}
