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
    include: { quote: { include: { client: true } }, client: true, profile: true },
  });

  if (!receivable) {
    notFound();
  }

  // 報價單來源用 quote 的標題/客戶，定期請款產生的用自身欄位
  const title = receivable.quote?.title ?? receivable.title ?? "定期請款";
  const clientName = receivable.quote?.client.name ?? receivable.client?.name ?? "";
  const { profile } = receivable;

  const pdf = await renderReceiptPdf({
    quoteTitle: title,
    clientName,
    freelancerName: profile.name ?? profile.email,
    issueDate: receivable.createdAt,
    dueDate: receivable.dueDate,
    kind: receivable.kind,
    amount: Number(receivable.amount),
    bankInfo: {
      bankName: profile.bankName,
      bankBranch: profile.bankBranch,
      bankAccount: profile.bankAccount,
      bankAccountHolder: profile.bankAccountHolder,
    },
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inlineDisposition(`${title}-請款單.pdf`),
    },
  });
}
