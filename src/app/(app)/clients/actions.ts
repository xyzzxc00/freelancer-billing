"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function createClientAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name) {
    throw new Error("客戶名稱不能為空");
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
  redirect("/clients");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name) {
    throw new Error("客戶名稱不能為空");
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
  redirect("/clients");
}

export async function deleteClientAction(clientId: string) {
  const userId = await requireUserId();

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  revalidatePath("/clients");
  redirect("/clients");
}
