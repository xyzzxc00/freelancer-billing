import { describe, it, expect } from "vitest";
import { buildGeneratedReceivable } from "../recurring-receivable";

describe("buildGeneratedReceivable", () => {
  it("標題帶上年月，同名請款每個月分得出來", () => {
    const r = buildGeneratedReceivable(
      { title: "網站維護月費", dueInDays: 14 },
      new Date(Date.UTC(2026, 6, 5)),
      "2026-07"
    );
    expect(r.title).toBe("網站維護月費（2026-07）");
  });

  it("到期日是產生日加上 dueInDays", () => {
    const r = buildGeneratedReceivable(
      { title: "月費", dueInDays: 14 },
      new Date(Date.UTC(2026, 6, 5)),
      "2026-07"
    );
    expect(r.dueDate.toISOString().slice(0, 10)).toBe("2026-07-19");
  });

  it("到期日跨月時正確進位", () => {
    const r = buildGeneratedReceivable(
      { title: "月費", dueInDays: 14 },
      new Date(Date.UTC(2026, 0, 25)),
      "2026-01"
    );
    expect(r.dueDate.toISOString().slice(0, 10)).toBe("2026-02-08");
  });

  it("dueInDays 為 0 時到期日就是產生日當天", () => {
    const occurredAt = new Date(Date.UTC(2026, 6, 5));
    const r = buildGeneratedReceivable({ title: "月費", dueInDays: 0 }, occurredAt, "2026-07");
    expect(r.dueDate.toISOString().slice(0, 10)).toBe("2026-07-05");
    // 不能改到原本傳入的日期物件
    expect(occurredAt.toISOString().slice(0, 10)).toBe("2026-07-05");
  });
});
