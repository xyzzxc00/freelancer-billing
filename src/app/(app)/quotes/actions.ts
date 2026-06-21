"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import type { TaxMode } from "@/lib/tax";

interface ItemInput {
  name: string;
  unitPrice: number;
  quantity: number;
}

function parseItems(raw: string): ItemInput[] {
  const parsed = JSON.parse(raw) as ItemInput[];
  return parsed
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name.trim(),
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
    }));
}

export async function createQuoteAction(formData: FormData) {
  const userId = await requireUserId();

  const clientId = String(formData.get("clientId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const taxMode = String(formData.get("taxMode") ?? "NONE") as TaxMode;
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!clientId || !title || items.length === 0) {
    throw new Error("請選擇客戶、填寫標題並至少新增一個項目");
  }

  const quote = await prisma.quote.create({
    data: {
      userId,
      clientId,
      title,
      taxMode,
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
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteItemsAction(quoteId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const taxMode = String(formData.get("taxMode") ?? "NONE") as TaxMode;
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!title || items.length === 0) {
    throw new Error("請填寫標題並至少新增一個項目");
  }

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId } });
  if (!quote) throw new Error("找不到報價單");

  await prisma.$transaction([
    prisma.quoteItem.deleteMany({ where: { quoteId } }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        title,
        taxMode,
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
  redirect(`/quotes/${quoteId}`);
}

export async function markQuoteSentAction(quoteId: string) {
  const userId = await requireUserId();

  await prisma.quote.updateMany({
    where: { id: quoteId, userId, status: "DRAFT" },
    data: { status: "SENT", sentAt: new Date() },
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
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
  revalidatePath("/transactions");
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
