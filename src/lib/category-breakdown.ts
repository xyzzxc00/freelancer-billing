export interface CategoryGroup {
  categoryId: string | null;
  amount: number;
}

export interface CategoryAmount {
  name: string;
  amount: number;
}

/** 把 Prisma groupBy 的結果換成分類名稱，未分類或分類已被刪除的都歸到「未分類」，依金額由大到小排序 */
export function buildCategoryBreakdown(
  groups: CategoryGroup[],
  names: Map<string, string>
): CategoryAmount[] {
  return groups
    .map((g) => ({
      name: (g.categoryId && names.get(g.categoryId)) || "未分類",
      amount: g.amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}
