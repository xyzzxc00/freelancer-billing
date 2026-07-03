import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { toCsvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { occurredAt: "asc" },
    include: { expenseCategory: true },
  });

  const header = ["日期", "類型", "分類", "金額", "備註"];
  const rows = transactions.map((t) => [
    t.occurredAt.toISOString().slice(0, 10),
    t.type === "INCOME" ? "收入" : "支出",
    t.expenseCategory?.name ?? t.category ?? "",
    String(t.amount),
    t.note ?? "",
  ]);

  return toCsvResponse([header, ...rows], `收支報表-${year}.csv`);
}
