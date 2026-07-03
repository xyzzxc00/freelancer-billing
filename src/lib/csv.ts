export function csvEscape(value: string) {
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
