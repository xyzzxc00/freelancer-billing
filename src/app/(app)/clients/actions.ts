"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { clientSchema } from "@/lib/schemas";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    contact: String(formData.get("contact") ?? "").trim() || undefined,
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
}

export async function createClientAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseClientForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, contact, note } = parsed.data;

  try {
    await prisma.client.create({
      data: { userId, name, contact: contact ?? null, note: note ?? null },
    });
  } catch (err) {
    console.error("新增客戶失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/clients");
  redirectWithToast("/clients", "已新增客戶");
}

export async function updateClientAction(
  clientId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = parseClientForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, contact, note } = parsed.data;

  try {
    await prisma.client.updateMany({
      where: { id: clientId, userId },
      data: { name, contact: contact ?? null, note: note ?? null },
    });
  } catch (err) {
    console.error("更新客戶資料失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirectWithToast("/clients", "已更新客戶資料");
}

export async function deleteClientAction(clientId: string) {
  const userId = await requireUserId();

  try {
    await prisma.client.deleteMany({
      where: { id: clientId, userId },
    });
  } catch (err) {
    console.error("刪除客戶失敗:", err);
    redirectWithToast("/clients", GENERIC_ACTION_ERROR, "error");
  }

  revalidatePath("/clients");
  redirect("/clients");
}
