import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderQuotePdf } from "@/lib/quote-pdf";
import { contentDisposition } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: { client: true, profile: true, items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quote || quote.status === "DRAFT") {
    notFound();
  }

  const pdf = await renderQuotePdf({
    title: quote.title,
    clientName: quote.client.name,
    freelancerName: quote.profile.name ?? quote.profile.email,
    items: quote.items.map((item) => ({
      name: item.name,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
    })),
    taxMode: quote.taxMode,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(`${quote.title}.pdf`),
    },
  });
}
