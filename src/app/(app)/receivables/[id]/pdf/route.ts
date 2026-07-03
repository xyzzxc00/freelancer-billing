import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { renderReceiptPdf } from "@/lib/receipt-pdf";
import { inlineDisposition } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const receivable = await prisma.receivable.findFirst({
    where: { id, userId },
    include: { quote: { include: { client: true, profile: true } } },
  });

  if (!receivable) {
    notFound();
  }

  const { quote } = receivable;

  const pdf = await renderReceiptPdf({
    quoteTitle: quote.title,
    clientName: quote.client.name,
    freelancerName: quote.profile.name ?? quote.profile.email,
    issueDate: receivable.createdAt,
    dueDate: receivable.dueDate,
    kind: receivable.kind,
    amount: Number(receivable.amount),
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
      "Content-Disposition": inlineDisposition(`${quote.title}-請款單.pdf`),
    },
  });
}
