import { describe, it, expect } from "vitest";
import { transactionSchema, clientSchema, categorySchema, recurringSchema } from "../schemas";

describe("transactionSchema", () => {
  it("接受有效的交易資料", () => {
    expect(transactionSchema.safeParse({ amount: 1000, occurredAt: "2024-01-15" }).success).toBe(true);
  });
  it("拒絕金額為 0", () => {
    expect(transactionSchema.safeParse({ amount: 0, occurredAt: "2024-01-15" }).success).toBe(false);
  });
  it("拒絕負數金額", () => {
    expect(transactionSchema.safeParse({ amount: -500, occurredAt: "2024-01-15" }).success).toBe(false);
  });
  it("拒絕無效日期格式", () => {
    expect(transactionSchema.safeParse({ amount: 100, occurredAt: "not-a-date" }).success).toBe(false);
  });
  it("拒絕空日期", () => {
    expect(transactionSchema.safeParse({ amount: 100, occurredAt: "" }).success).toBe(false);
  });
  it("備註是選填，可以省略", () => {
    expect(transactionSchema.safeParse({ amount: 100, occurredAt: "2024-01-15" }).success).toBe(true);
  });
  it("備註超過 500 字元時拒絕", () => {
    expect(transactionSchema.safeParse({ amount: 100, occurredAt: "2024-01-15", note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("接受有效的客戶資料", () => {
    expect(clientSchema.safeParse({ name: "林氏設計工作室" }).success).toBe(true);
  });
  it("拒絕空白名稱", () => {
    expect(clientSchema.safeParse({ name: "" }).success).toBe(false);
  });
  it("拒絕名稱超過 100 字元", () => {
    expect(clientSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
  it("聯絡方式是選填", () => {
    expect(clientSchema.safeParse({ name: "林氏設計" }).success).toBe(true);
  });
});

describe("categorySchema", () => {
  it("接受有效的分類名稱", () => {
    expect(categorySchema.safeParse({ name: "交通費" }).success).toBe(true);
  });
  it("拒絕空白名稱", () => {
    expect(categorySchema.safeParse({ name: "" }).success).toBe(false);
  });
  it("拒絕超過 50 字元的名稱", () => {
    expect(categorySchema.safeParse({ name: "a".repeat(51) }).success).toBe(false);
  });
});

describe("recurringSchema", () => {
  it("接受有效的定期記錄", () => {
    expect(recurringSchema.safeParse({ name: "Netflix", amount: 390, dayOfMonth: 15 }).success).toBe(true);
  });
  it("拒絕扣款日 0", () => {
    expect(recurringSchema.safeParse({ name: "Netflix", amount: 390, dayOfMonth: 0 }).success).toBe(false);
  });
  it("拒絕扣款日超過 28", () => {
    expect(recurringSchema.safeParse({ name: "Netflix", amount: 390, dayOfMonth: 29 }).success).toBe(false);
  });
  it("拒絕金額為 0", () => {
    expect(recurringSchema.safeParse({ name: "Netflix", amount: 0, dayOfMonth: 15 }).success).toBe(false);
  });
});
