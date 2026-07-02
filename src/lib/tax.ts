export type TaxMode = "NONE" | "BUSINESS_5PCT" | "LABOR_INCOME_10PCT";

export interface TaxBreakdown {
  subtotal: number;
  clientTotal: number; // 客戶實際要付的金額
  freelancerNet: number; // 自己實拿金額
  clientLines: { label: string; amount: number }[]; // 加總會等於 clientTotal
  freelancerLines: { label: string; amount: number }[]; // 加總會等於 freelancerNet
}

const HEALTH_SUPPLEMENT_THRESHOLD = 20000;
const HEALTH_SUPPLEMENT_RATE = 0.0211;
const WITHHOLDING_RATE = 0.1;
const BUSINESS_TAX_RATE = 0.05;

export function calculateTax(subtotal: number, mode: TaxMode): TaxBreakdown {
  // 稅額一律四捨五入到整數元（台灣實務），總額由取整後的各行加總而得，
  // 確保明細相加永遠等於總額，不會因浮點運算出現一元落差
  if (mode === "BUSINESS_5PCT") {
    const tax = Math.round(subtotal * BUSINESS_TAX_RATE);
    return {
      subtotal,
      clientTotal: subtotal + tax,
      freelancerNet: subtotal,
      clientLines: [
        { label: "未稅金額", amount: subtotal },
        { label: "營業稅 5%（需開發票）", amount: tax },
      ],
      freelancerLines: [{ label: "未稅金額（實拿）", amount: subtotal }],
    };
  }

  if (mode === "LABOR_INCOME_10PCT") {
    const withholding = Math.round(subtotal * WITHHOLDING_RATE);
    const healthSupplement =
      subtotal > HEALTH_SUPPLEMENT_THRESHOLD
        ? Math.round(subtotal * HEALTH_SUPPLEMENT_RATE)
        : 0;
    return {
      subtotal,
      clientTotal: subtotal,
      freelancerNet: subtotal - withholding - healthSupplement,
      clientLines: [{ label: "委託報酬總額", amount: subtotal }],
      freelancerLines: [
        { label: "委託報酬總額", amount: subtotal },
        { label: "代扣勞務報酬所得稅 10%", amount: -withholding },
        ...(healthSupplement > 0
          ? [{ label: "二代健保補充保費 2.11%（單筆逾 2 萬）", amount: -healthSupplement }]
          : []),
      ],
    };
  }

  return {
    subtotal,
    clientTotal: subtotal,
    freelancerNet: subtotal,
    clientLines: [{ label: "金額", amount: subtotal }],
    freelancerLines: [{ label: "金額", amount: subtotal }],
  };
}

export const taxModeLabel: Record<TaxMode, string> = {
  NONE: "未稅／不試算",
  BUSINESS_5PCT: "含營業稅 5%（開發票）",
  LABOR_INCOME_10PCT: "勞務報酬（代扣 10% + 二代健保）",
};
