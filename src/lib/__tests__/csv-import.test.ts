import { describe, it, expect } from "vitest";
import {
  parseCsvText,
  parseCsvDate,
  parseCsvAmount,
  buildImportRows,
} from "../csv-import";

describe("parseCsvText", () => {
  it("解析基本逗號分隔內容", () => {
    expect(parseCsvText("日期,金額,備註\n2026-07-01,1000,午餐")).toEqual([
      ["日期", "金額", "備註"],
      ["2026-07-01", "1000", "午餐"],
    ]);
  });

  it("處理引號欄位內含逗號與跳脫雙引號", () => {
    const csv = 'a,b\n"1,234","說 ""你好"""';
    expect(parseCsvText(csv)).toEqual([
      ["a", "b"],
      ["1,234", '說 "你好"'],
    ]);
  });

  it("處理引號欄位內的換行", () => {
    const csv = 'a,b\n"第一行\n第二行",ok';
    expect(parseCsvText(csv)).toEqual([
      ["a", "b"],
      ["第一行\n第二行", "ok"],
    ]);
  });

  it("去除開頭 BOM", () => {
    const csv = "﻿a,b\n1,2";
    expect(parseCsvText(csv)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("CRLF 換行也能正確斷行", () => {
    expect(parseCsvText("a,b\r\n1,2\r\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("結尾多一個換行不會產生空列", () => {
    expect(parseCsvText("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseCsvDate", () => {
  it("YMD 格式（支援 - 或 / 分隔）", () => {
    expect(parseCsvDate("2026-07-16", "YMD")).toEqual(new Date(Date.UTC(2026, 6, 16)));
    expect(parseCsvDate("2026/07/16", "YMD")).toEqual(new Date(Date.UTC(2026, 6, 16)));
  });

  it("YMD_COMPACT（YYYYMMDD 無分隔符）", () => {
    expect(parseCsvDate("20260716", "YMD_COMPACT")).toEqual(new Date(Date.UTC(2026, 6, 16)));
    expect(parseCsvDate("2026-07-16", "YMD_COMPACT")).toBeNull();
  });

  it("MDY 格式", () => {
    expect(parseCsvDate("07/16/2026", "MDY")).toEqual(new Date(Date.UTC(2026, 6, 16)));
  });

  it("DMY 格式", () => {
    expect(parseCsvDate("16/07/2026", "DMY")).toEqual(new Date(Date.UTC(2026, 6, 16)));
  });

  it("不合法的日期（例如 2 月 30 日）回傳 null", () => {
    expect(parseCsvDate("2026-02-30", "YMD")).toBeNull();
  });

  it("格式不符（欄位數不對、非數字）回傳 null", () => {
    expect(parseCsvDate("2026-07", "YMD")).toBeNull();
    expect(parseCsvDate("not-a-date", "YMD")).toBeNull();
    expect(parseCsvDate("", "YMD")).toBeNull();
  });
});

describe("parseCsvAmount", () => {
  it("純數字", () => {
    expect(parseCsvAmount("1000")).toBe(1000);
    expect(parseCsvAmount("1000.5")).toBe(1000.5);
  });

  it("千分位逗號", () => {
    expect(parseCsvAmount("1,234,567")).toBe(1234567);
  });

  it("貨幣符號", () => {
    expect(parseCsvAmount("NT$1,000")).toBe(1000);
    expect(parseCsvAmount("$500")).toBe(500);
  });

  it("負數（前綴減號）", () => {
    expect(parseCsvAmount("-500")).toBe(-500);
  });

  it("括號代表負數（會計格式）", () => {
    expect(parseCsvAmount("(500)")).toBe(-500);
  });

  it("0 或空字串或無法解析回傳 null", () => {
    expect(parseCsvAmount("0")).toBeNull();
    expect(parseCsvAmount("")).toBeNull();
    expect(parseCsvAmount("abc")).toBeNull();
  });

  it("超出可匯入上限的極端值回傳 null，避免資料庫 Decimal(12,2) 溢位", () => {
    expect(parseCsvAmount("99999999.99")).toBe(99999999.99);
    expect(parseCsvAmount("100000000")).toBeNull();
    expect(parseCsvAmount("999999999999")).toBeNull();
  });
});

describe("buildImportRows", () => {
  const baseMapping = {
    dateColumn: 0,
    amountColumn: 1,
    noteColumn: 2 as number | null,
    dateFormat: "YMD" as const,
    typeMode: "SIGN_BASED" as const,
  };

  it("SIGN_BASED：正數收入、負數支出，金額都轉正值", () => {
    const { rows, errors } = buildImportRows(
      [
        ["2026-07-01", "1000", "接案收入"],
        ["2026-07-02", "-200", "午餐"],
      ],
      baseMapping
    );
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { type: "INCOME", amount: 1000, occurredAt: new Date(Date.UTC(2026, 6, 1)), note: "接案收入" },
      { type: "EXPENSE", amount: 200, occurredAt: new Date(Date.UTC(2026, 6, 2)), note: "午餐" },
    ]);
  });

  it("ALL_EXPENSE：全部歸類為支出，忽略正負號", () => {
    const { rows } = buildImportRows(
      [["2026-07-01", "300", ""]],
      { ...baseMapping, typeMode: "ALL_EXPENSE" }
    );
    expect(rows[0].type).toBe("EXPENSE");
    expect(rows[0].amount).toBe(300);
  });

  it("沒有備註欄位（noteColumn: null）時 note 為 null", () => {
    const { rows } = buildImportRows(
      [["2026-07-01", "300"]],
      { ...baseMapping, noteColumn: null }
    );
    expect(rows[0].note).toBeNull();
  });

  it("日期或金額無法解析的列會被跳過並記錄錯誤，不影響其他列", () => {
    const { rows, errors } = buildImportRows(
      [
        ["2026-07-01", "1000", "ok"],
        ["not-a-date", "500", "壞列"],
        ["2026-07-03", "abc", "壞列2"],
        ["2026-07-04", "200", "ok2"],
      ],
      baseMapping
    );
    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({ rowIndex: 2 });
    expect(errors[1]).toMatchObject({ rowIndex: 3 });
  });
});
