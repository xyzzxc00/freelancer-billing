// 統一解析 ?year= / ?month= query 參數。
// 直接 Number() 會讓 ?year=abc 變成 NaN，傳進 new Date(NaN, 0, 1) 後
// Prisma 會直接丟 PrismaClientValidationError（整頁 500），所以超出範圍一律回退預設值。
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function parseYearParam(raw: string | undefined | null): number {
  const year = Number(raw);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return new Date().getFullYear();
  }
  return year;
}

export function parseMonthParam(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const month = Number(raw);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return month;
}
