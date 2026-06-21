"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

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

export async function createTemplateAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!name || items.length === 0) {
    throw new Error("請填寫範本名稱並至少新增一個項目");
  }

  await prisma.quoteTemplate.create({
    data: {
      userId,
      name,
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

  revalidatePath("/quotes/templates");
  redirect("/quotes/templates");
}

export async function deleteTemplateAction(templateId: string) {
  const userId = await requireUserId();

  await prisma.quoteTemplate.deleteMany({ where: { id: templateId, userId } });

  revalidatePath("/quotes/templates");
}
