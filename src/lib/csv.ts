export function csvEscape(value: string) {
  // 開頭是 = + - @ 或 tab/CR 的儲存格，Excel/Sheets 會當成公式執行（CSV injection），
  // 補一個單引號讓它一律被當成純文字；純數字（如負數金額）不受影響
  if (/^[=+\-@\t\r]/.test(value) && !Number.isFinite(Number(value))) {
    value = `'${value}`;
  }
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsvResponse(rows: string[][], filename: string): Response {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const csvWithBom = "﻿" + csv;

  return new Response(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
