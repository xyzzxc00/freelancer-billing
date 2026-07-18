// 定期請款每月產生應收款時的欄位計算，抽成純函式方便測試

export function buildGeneratedReceivable(
  def: { title: string; dueInDays: number },
  occurredAt: Date,
  yearMonth: string
): { title: string; dueDate: Date } {
  const dueDate = new Date(occurredAt);
  dueDate.setUTCDate(dueDate.getUTCDate() + def.dueInDays);
  // 標題帶上年月，同一個定期請款每個月產生的應收款才分得出來
  return { title: `${def.title}（${yearMonth}）`, dueDate };
}
