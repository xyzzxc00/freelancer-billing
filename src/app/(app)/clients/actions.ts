"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import type { ActionResult } from "@/lib/action-state";

export async function createClientAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name) {
    return { error: "客戶名稱不能為空" };
  }

  await prisma.client.create({
    data: {
      userId,
      name,
      contact: contact || null,
      note: note || null,
    },
  });

  revalidatePath("/clients");
  redirectWithToast("/clients", "已新增客戶");
}

export async function updateClientAction(
  clientId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name) {
    return { error: "客戶名稱不能為空" };
  }

  await prisma.client.updateMany({
    where: { id: clientId, userId },
    data: {
      name,
      contact: contact || null,
      note: note || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirectWithToast("/clients", "已更新客戶資料");
}

export async function deleteClientAction(clientId: string) {
  const userId = await requireUserId();

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  revalidatePath("/clients");
  redirect("/clients");
}
