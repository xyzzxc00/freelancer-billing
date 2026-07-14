import { describe, it, expect } from "vitest";
import { csvEscape } from "../csv";

describe("csvEscape", () => {
  it("一般文字原樣輸出", () => {
    expect(csvEscape("接案收入")).toBe("接案收入");
  });

  it("含逗號、引號、換行時加引號包裹", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('說 "hi"')).toBe('"說 ""hi"""');
    expect(csvEscape("第一行\n第二行")).toBe('"第一行\n第二行"');
  });

  it("開頭是公式字元時補單引號，防 CSV injection", () => {
    expect(csvEscape("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvEscape("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(csvEscape("@evil")).toBe("'@evil");
    expect(csvEscape("-2+3")).toBe("'-2+3");
  });

  it("純數字（含負數）不加單引號", () => {
    expect(csvEscape("1200")).toBe("1200");
    expect(csvEscape("-500")).toBe("-500");
    expect(csvEscape("-500.5")).toBe("-500.5");
  });

  it("公式字元同時含逗號時兩種轉義都套用", () => {
    expect(csvEscape("=A1,B1")).toBe('"\'=A1,B1"');
  });
});
