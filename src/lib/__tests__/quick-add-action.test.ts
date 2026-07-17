import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateIncome = vi.hoisted(() => vi.fn());
const mockCreateExpense = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/income/actions", () => ({
  createIncomeAction: mockCreateIncome,
}));

vi.mock("@/app/(app)/expenses/actions", () => ({
  createExpenseAction: mockCreateExpense,
}));

import { quickAddTransactionAction } from "../quick-add-action";

describe("quickAddTransactionAction", () => {
  beforeEach(() => {
    mockCreateIncome.mockReset().mockResolvedValue(undefined);
    mockCreateExpense.mockReset().mockResolvedValue(undefined);
  });

  it("type=income 時把 categoryId 轉成 incomeCategoryId 再交給 createIncomeAction", async () => {
    const formData = new FormData();
    formData.set("type", "income");
    formData.set("categoryId", "cat_123");

    await quickAddTransactionAction(undefined, formData);

    expect(mockCreateIncome).toHaveBeenCalledOnce();
    expect(mockCreateExpense).not.toHaveBeenCalled();
    const passed = mockCreateIncome.mock.calls[0][1] as FormData;
    expect(passed.get("incomeCategoryId")).toBe("cat_123");
  });

  it("type=income 沒選分類時 incomeCategoryId 是空字串（底層 action 會轉 null）", async () => {
    const formData = new FormData();
    formData.set("type", "income");

    await quickAddTransactionAction(undefined, formData);

    const passed = mockCreateIncome.mock.calls[0][1] as FormData;
    expect(passed.get("incomeCategoryId")).toBe("");
  });

  it("type=expense 時直接交給 createExpenseAction，categoryId 原樣保留", async () => {
    const formData = new FormData();
    formData.set("type", "expense");
    formData.set("categoryId", "cat_456");

    await quickAddTransactionAction(undefined, formData);

    expect(mockCreateExpense).toHaveBeenCalledOnce();
    expect(mockCreateIncome).not.toHaveBeenCalled();
    const passed = mockCreateExpense.mock.calls[0][1] as FormData;
    expect(passed.get("categoryId")).toBe("cat_456");
    expect(passed.get("incomeCategoryId")).toBeNull();
  });

  it("沒帶 type 時預設走支出", async () => {
    const formData = new FormData();

    await quickAddTransactionAction(undefined, formData);

    expect(mockCreateExpense).toHaveBeenCalledOnce();
    expect(mockCreateIncome).not.toHaveBeenCalled();
  });

  it("回傳底層 action 的結果（例如驗證錯誤）", async () => {
    mockCreateExpense.mockResolvedValue({ error: "金額必須大於 0" });
    const formData = new FormData();
    formData.set("type", "expense");

    const result = await quickAddTransactionAction(undefined, formData);

    expect(result).toEqual({ error: "金額必須大於 0" });
  });
});
