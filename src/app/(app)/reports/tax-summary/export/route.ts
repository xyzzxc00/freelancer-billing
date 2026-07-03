import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { calculateTax, taxModeLabel, type TaxMode } from "@/lib/tax";
import { toCsvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const quotes = await prisma.quote.findMany({
    where: {
      userId,
      status: "ACCEPTED",
      taxMode: { not: "NONE" },
      respondedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    include: { client: true, items: true },
    orderBy: { respondedAt: "asc" },
  });

  const header = ["日期", "客戶", "報價標題", "稅制", "委託報酬總額", "代扣稅額", "二代健保", "實拿金額"];
  const rows = quotes.map((q) => {
    const subtotal = q.items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
    const breakdown = calculateTax(subtotal, q.taxMode);
    const withholding = breakdown.freelancerLines.find((l) => l.label.includes("代扣"));
    const healthSupplement = breakdown.freelancerLines.find((l) => l.label.includes("健保"));
    return [
      q.respondedAt!.toISOString().slice(0, 10),
      q.client.name,
      q.title,
      taxModeLabel[q.taxMode as TaxMode],
      String(subtotal),
      String(withholding ? -withholding.amount : 0),
      String(healthSupplement ? -healthSupplement.amount : 0),
      String(breakdown.freelancerNet),
    ];
  });

  return toCsvResponse([header, ...rows], `報稅彙總-${year}.csv`);
}
