"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { taxModeLabel, type TaxMode } from "@/lib/tax";
import { calculateDepositSplit } from "@/lib/deposit";
import { extractEmail } from "@/lib/extract-email";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseTaxMode(formData: FormData): TaxMode | null {
  const raw = String(formData.get("taxMode") ?? "NONE");
  return raw in taxModeLabel ? (raw as TaxMode) : null;
}

function parseDepositPercent(formData: FormData): { ok: true; value: number | null } | { ok: false; error: string } {
  const raw = String(formData.get("depositPercent") ?? "").trim();
  if (!raw) return { ok: true, value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1 || value > 99) {
    return { ok: false, error: "訂金比例請填 1-99 之間的數字" };
  }
  return { ok: true, value: Math.round(value) };
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
  const taxMode = parseTaxMode(formData);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const terms = String(formData.get("terms") ?? "").trim() || null;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (!clientId) {
    return { error: "請選擇客戶" };
  }
  if (!title) {
    return { error: "請填寫標題" };
  }
  if (!taxMode) {
    return { error: "稅務方式不正確，請重新選擇" };
  }
  if (terms && terms.length > 2000) {
    return { error: "合約條款請控制在 2000 字以內" };
  }
  const parsed = parseItems(String(formData.get("items") ?? "[]"));
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const items = parsed.items;
  const depositResult = parseDepositPercent(formData);
  if (!depositResult.ok) {
    return { error: depositResult.error };
  }
  const depositPercent = depositResult.value;

  // 確認客戶屬於目前使用者，避免把報價掛到別人的客戶上
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!client) {
    return { error: "請選擇客戶" };
  }

  let quote;
  try {
    quote = await prisma.quote.create({
      data: {
        userId,
        clientId,
        title,
        taxMode,
        notes,
        terms,
        expiresAt,
        depositPercent,
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
  } catch (err) {
    console.error("建立報價單失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

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
  const taxMode = parseTaxMode(formData);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const terms = String(formData.get("terms") ?? "").trim() || null;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (!title) {
    return { error: "請填寫標題" };
  }
  if (!taxMode) {
    return { error: "稅務方式不正確，請重新選擇" };
  }
  if (terms && terms.length > 2000) {
    return { error: "合約條款請控制在 2000 字以內" };
  }
  const parsed = parseItems(String(formData.get("items") ?? "[]"));
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const items = parsed.items;
  const depositResult = parseDepositPercent(formData);
  if (!depositResult.ok) {
    return { error: depositResult.error };
  }
  const depositPercent = depositResult.value;

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId } });
  if (!quote) {
    return { error: "找不到報價單" };
  }

  try {
    await prisma.$transaction([
      prisma.quoteItem.deleteMany({ where: { quoteId } }),
      prisma.quote.update({
        where: { id: quoteId },
        data: {
          title,
          taxMode,
          notes,
          terms,
          expiresAt,
          depositPercent,
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
  } catch (err) {
    console.error("更新報價單失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

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

  try {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    console.error("標記報價單為送出失敗:", err);
    redirectWithToast(`/quotes/${quoteId}`, GENERIC_ACTION_ERROR, "error");
  }

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
        html: `<p>你好，</p><p>${escapeHtml(senderName)} 提供了一份報價單給你：<strong>${escapeHtml(quote.title)}</strong></p><p><a href="${shareUrl}">點此查看報價單並回覆</a></p>`,
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
  if (!quote) return;

  const subtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );

  const finalDueDate = new Date();
  finalDueDate.setDate(finalDueDate.getDate() + 30);

  try {
    if (quote.depositPercent) {
      const { depositAmount, finalAmount } = calculateDepositSplit(subtotal, quote.depositPercent);
      await prisma.$transaction([
        prisma.quote.update({
          where: { id: quoteId },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        }),
        prisma.receivable.create({
          data: { userId, quoteId, kind: "DEPOSIT", amount: depositAmount, dueDate: new Date() },
        }),
        prisma.receivable.create({
          data: { userId, quoteId, kind: "FINAL", amount: finalAmount, dueDate: finalDueDate },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.quote.update({
          where: { id: quoteId },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        }),
        prisma.receivable.create({
          data: { userId, quoteId, kind: "FULL", amount: subtotal, dueDate: finalDueDate },
        }),
      ]);
    }
  } catch (err) {
    console.error("接受報價單失敗:", err);
    redirectWithToast(`/quotes/${quoteId}`, GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath("/income");
  redirectWithToast(`/quotes/${quoteId}`, "已標記為已接受，轉入待收款");
}

export async function rejectQuoteAction(quoteId: string) {
  const userId = await requireUserId();

  try {
    await prisma.quote.updateMany({
      where: { id: quoteId, userId },
      data: { status: "REJECTED", respondedAt: new Date() },
    });
  } catch (err) {
    console.error("拒絕報價單失敗:", err);
    redirectWithToast(`/quotes/${quoteId}`, GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  redirectWithToast(`/quotes/${quoteId}`, "已標記為已拒絕");
}

export async function deleteQuoteAction(quoteId: string) {
  const userId = await requireUserId();

  // 已收款的報價刪除會連帶刪掉應收款，但入帳交易仍在，導致帳目對不上——直接擋下
  const paidReceivable = await prisma.receivable.findFirst({
    where: { quoteId, userId, status: "PAID" },
    select: { id: true },
  });
  if (paidReceivable) {
    redirectWithToast(`/quotes/${quoteId}`, "這張報價單已有入帳紀錄，無法刪除", "error");
  }

  try {
    await prisma.quote.deleteMany({ where: { id: quoteId, userId } });
  } catch (err) {
    console.error("刪除報價單失敗:", err);
    redirectWithToast("/quotes", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/quotes");
  redirect("/quotes");
}
