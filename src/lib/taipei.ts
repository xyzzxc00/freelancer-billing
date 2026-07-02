// Vercel 伺服器時區是 UTC，直接用 getDate()/getMonth() 拿到的是 UTC 日期，
// 台灣（UTC+8）在凌晨 0-8 點會差一天。這裡統一提供「台灣日曆日」的時間工具。

/** 平移 +8 小時後的 Date，之後請一律用 getUTC* 系列方法讀取台灣的年月日 */
export function taipeiNow(): Date {
  return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

/** 台灣「今天」的日期，以 UTC 午夜表示——與表單日期欄位 new Date("YYYY-MM-DD") 的存法一致 */
export function startOfTodayTaipei(): Date {
  const t = taipeiNow();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
}

/** 台灣時間的 "YYYY-MM" 字串，供定期收支的同月去重使用 */
export function taipeiYearMonth(): string {
  const t = taipeiNow();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 台灣時間的「今天是幾號」 */
export function taipeiDayOfMonth(): number {
  return taipeiNow().getUTCDate();
}

/** 台灣「本月」的起訖（UTC 午夜表示），供 occurredAt 區間篩選使用 */
export function taipeiMonthRange(): { start: Date; end: Date } {
  const t = taipeiNow();
  return {
    start: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)),
    end: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1)),
  };
}
