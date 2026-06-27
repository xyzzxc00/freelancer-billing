import { z } from "zod";

export const amountSchema = z
  .number({ error: "金額必須是數字" })
  .positive("請填寫大於 0 的金額")
  .finite();

export const dateSchema = z
  .string()
  .min(1, "請選擇日期")
  .refine((v) => !isNaN(Date.parse(v)), { message: "日期格式不正確" });

export const clientSchema = z.object({
  name: z.string().min(1, "客戶名稱不能為空").max(100),
  contact: z.string().max(500).optional(),
  note: z.string().max(1000).optional(),
});

export const transactionSchema = z.object({
  amount: amountSchema,
  occurredAt: dateSchema,
  note: z.string().max(500).optional(),
});

export const recurringSchema = z.object({
  name: z.string().min(1, "請輸入名稱").max(100),
  amount: amountSchema,
  dayOfMonth: z
    .number()
    .int()
    .min(1, "每月扣款日請選擇 1-28 之間")
    .max(28, "每月扣款日請選擇 1-28 之間"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "請輸入分類名稱").max(50),
});
