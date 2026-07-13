import { describe, it, expect } from "vitest";
import { buildCategoryBreakdown } from "../category-breakdown";

describe("buildCategoryBreakdown", () => {
  it("依 categoryId 對應到分類名稱", () => {
    const names = new Map([["cat_1", "交通"], ["cat_2", "餐飲"]]);
    const result = buildCategoryBreakdown(
      [
        { categoryId: "cat_1", amount: 500 },
        { categoryId: "cat_2", amount: 1200 },
      ],
      names
    );

    expect(result).toEqual([
      { name: "餐飲", amount: 1200 },
      { name: "交通", amount: 500 },
    ]);
  });

  it("categoryId 為 null 時歸類為「未分類」", () => {
    const result = buildCategoryBreakdown([{ categoryId: null, amount: 300 }], new Map());
    expect(result).toEqual([{ name: "未分類", amount: 300 }]);
  });

  it("categoryId 有值但在名稱表裡找不到（分類已被刪除）時也歸為「未分類」", () => {
    const result = buildCategoryBreakdown(
      [{ categoryId: "deleted_cat", amount: 300 }],
      new Map([["cat_1", "交通"]])
    );
    expect(result).toEqual([{ name: "未分類", amount: 300 }]);
  });

  it("依金額由大到小排序", () => {
    const names = new Map([["a", "A"], ["b", "B"], ["c", "C"]]);
    const result = buildCategoryBreakdown(
      [
        { categoryId: "a", amount: 100 },
        { categoryId: "b", amount: 900 },
        { categoryId: "c", amount: 500 },
      ],
      names
    );
    expect(result.map((r) => r.name)).toEqual(["B", "C", "A"]);
  });

  it("沒有資料時回傳空陣列", () => {
    expect(buildCategoryBreakdown([], new Map())).toEqual([]);
  });
});
