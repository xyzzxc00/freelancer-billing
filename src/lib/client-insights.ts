export interface PunctualityRecord {
  dueDate: Date;
  paidAt: Date;
}

export interface PunctualityResult {
  count: number;
  onTimeCount: number;
  lateCount: number;
  avgDaysLate: number | null; // 正=平均晚付、負=平均提前、null=沒有可計算的紀錄
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 依已收款的到期日與實付日算出客戶的付款準時度，用來判斷這個客戶通常準時還是拖款 */
export function buildPaymentPunctuality(records: PunctualityRecord[]): PunctualityResult {
  if (records.length === 0) {
    return { count: 0, onTimeCount: 0, lateCount: 0, avgDaysLate: null };
  }

  let lateCount = 0;
  let totalDays = 0;
  for (const r of records) {
    const days = (r.paidAt.getTime() - r.dueDate.getTime()) / MS_PER_DAY;
    totalDays += days;
    if (days > 0) lateCount++;
  }

  return {
    count: records.length,
    onTimeCount: records.length - lateCount,
    lateCount,
    avgDaysLate: Math.round(totalDays / records.length),
  };
}
