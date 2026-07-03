export interface DepositSplit {
  depositAmount: number;
  finalAmount: number;
}

/** 訂金四捨五入到整數元，尾款 = 總額 - 訂金，確保兩者加總永遠等於 subtotal */
export function calculateDepositSplit(subtotal: number, depositPercent: number): DepositSplit {
  const depositAmount = Math.round((subtotal * depositPercent) / 100);
  return { depositAmount, finalAmount: subtotal - depositAmount };
}
