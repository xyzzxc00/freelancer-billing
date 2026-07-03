import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { renderQuotePdf } from "@/lib/quote-pdf";
import { inlineDisposition } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const quote = await prisma.quote.findFirst({
    where: { id, userId },
    include: { client: true, profile: true, items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quote) {
    notFound();
  }

  const pdf = await renderQuotePdf({
    title: quote.title,
    clientName: quote.client.name,
    freelancerName: quote.profile.name ?? quote.profile.email,
    quoteDate: quote.sentAt ?? quote.createdAt,
    expiresAt: quote.expiresAt,
    notes: quote.notes,
    items: quote.items.map((item) => ({
      name: item.name,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
    })),
    taxMode: quote.taxMode,
    bankInfo: {
      bankName: quote.profile.bankName,
      bankBranch: quote.profile.bankBranch,
      bankAccount: quote.profile.bankAccount,
      bankAccountHolder: quote.profile.bankAccountHolder,
    },
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inlineDisposition(`${quote.title}.pdf`),
    },
  });
}
