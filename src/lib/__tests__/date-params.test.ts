import { describe, it, expect } from "vitest";
import { parseYearParam, parseMonthParam } from "@/lib/date-params";

describe("parseYearParam", () => {
  it("合法年份原樣回傳", () => {
    expect(parseYearParam("2025")).toBe(2025);
  });

  it("非數字回退到今年（不再讓 NaN 傳進 Prisma 變 500）", () => {
    expect(parseYearParam("abc")).toBe(new Date().getFullYear());
  });

  it("缺參數回退到今年", () => {
    expect(parseYearParam(undefined)).toBe(new Date().getFullYear());
    expect(parseYearParam(null)).toBe(new Date().getFullYear());
  });

  it("超出合理範圍回退到今年", () => {
    expect(parseYearParam("1999")).toBe(new Date().getFullYear());
    expect(parseYearParam("2101")).toBe(new Date().getFullYear());
  });

  it("小數回退到今年", () => {
    expect(parseYearParam("2025.5")).toBe(new Date().getFullYear());
  });
});

describe("parseMonthParam", () => {
  it("合法月份原樣回傳", () => {
    expect(parseMonthParam("1")).toBe(1);
    expect(parseMonthParam("12")).toBe(12);
  });

  it("缺參數回傳 null（代表整年）", () => {
    expect(parseMonthParam(undefined)).toBeNull();
    expect(parseMonthParam(null)).toBeNull();
  });

  it("超出 1-12 或非數字回傳 null", () => {
    expect(parseMonthParam("0")).toBeNull();
    expect(parseMonthParam("13")).toBeNull();
    expect(parseMonthParam("99")).toBeNull();
    expect(parseMonthParam("abc")).toBeNull();
  });
});
