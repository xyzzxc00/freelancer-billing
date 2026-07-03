import { describe, it, expect } from "vitest";
import { calculateDepositSplit } from "../deposit";

describe("calculateDepositSplit", () => {
  it("訂金四捨五入，尾款吸收誤差，加總永遠等於原金額", () => {
    // 33333 × 30% = 9999.9 → 10000，尾款 23333
    const r = calculateDepositSplit(33333, 30);
    expect(r.depositAmount).toBe(10000);
    expect(r.finalAmount).toBe(23333);
    expect(r.depositAmount + r.finalAmount).toBe(33333);
  });

  it("任何金額與比例下，訂金加尾款都等於原金額", () => {
    for (const subtotal of [1, 999, 12345, 87654, 1234567]) {
      for (const pct of [1, 10, 30, 50, 99]) {
        const r = calculateDepositSplit(subtotal, pct);
        expect(r.depositAmount + r.finalAmount).toBe(subtotal);
      }
    }
  });
});
