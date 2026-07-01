"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

interface ItemInput {
  name: string;
  unitPrice: number;
  quantity: number;
}

function parseItems(raw: string): ItemInput[] {
  let parsed: ItemInput[];
  try {
    parsed = JSON.parse(raw) as ItemInput[];
  } catch {
    return [];
  }
  return parsed
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name.trim(),
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
    }));
}

export async function createTemplateAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!name) {
    return { error: "請填寫範本名稱" };
  }
  if (items.length === 0) {
    return { error: "請至少新增一個項目" };
  }

  try {
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
  } catch (err) {
    console.error("新增報價範本失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/quotes/templates");
  redirectWithToast("/quotes/templates", "已建立範本");
}

export async function updateTemplateAction(
  templateId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!name) return { error: "請填寫範本名稱" };
  if (items.length === 0) return { error: "請至少新增一個項目" };

  const template = await prisma.quoteTemplate.findFirst({ where: { id: templateId, userId } });
  if (!template) return { error: "找不到範本" };

  try {
    await prisma.$transaction([
      prisma.quoteTemplateItem.deleteMany({ where: { templateId } }),
      prisma.quoteTemplate.update({
        where: { id: templateId },
        data: {
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
      }),
    ]);
  } catch (err) {
    console.error("更新報價範本失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/quotes/templates");
  redirectWithToast("/quotes/templates", "已更新範本");
}

export async function deleteTemplateAction(templateId: string) {
  const userId = await requireUserId();

  try {
    await prisma.quoteTemplate.deleteMany({ where: { id: templateId, userId } });
  } catch (err) {
    console.error("刪除報價範本失敗:", err);
    return;
  }

  revalidatePath("/quotes/templates");
}
