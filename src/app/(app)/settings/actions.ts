"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function updateProfileAction(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();

  await prisma.profile.update({
    where: { id: userId },
    data: { name: name || null },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}
