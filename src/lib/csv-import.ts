/** 簡易 RFC4180 風格 CSV 解析：處理引號欄位、跳脫雙引號（""）、CRLF/LF 換行，回傳 string[][]（第一列通常是表頭） */
export function parseCsvText(text: string): string[][] {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = withoutBom.length;

  function pushField() {
    row.push(field);
    field = "";
  }
  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (i < n) {
    const ch = withoutBom[i];
    if (inQuotes) {
      if (ch === '"') {
        if (withoutBom[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== "" || row.length > 0) {
    pushRow();
  }
  // 過濾整列只有一個空字串欄位的列（常見於檔案結尾多一個換行）
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export type CsvDateFormat = "YMD" | "YMD_COMPACT" | "MDY" | "DMY";

export const dateFormatLabel: Record<CsvDateFormat, string> = {
  YMD: "YYYY-MM-DD 或 YYYY/MM/DD",
  YMD_COMPACT: "YYYYMMDD（無分隔符號）",
  MDY: "MM/DD/YYYY",
  DMY: "DD/MM/YYYY",
};

function isValidDate(year: number, month: number, day: number): Date | null {
  if (year < 1000 || year > 9999) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // new Date 對超出範圍的日期（例如 2/30）會自動進位到 3 月，這裡要抓出來當無效日期
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** 依使用者指定的格式解析日期字串，格式不對或不是合法日期一律回傳 null（不用猜格式） */
export function parseCsvDate(raw: string, format: CsvDateFormat): Date | null {
  const v = raw.trim();
  if (!v) return null;

  if (format === "YMD_COMPACT") {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    return isValidDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  const parts = v.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map(Number);
  if ([a, b, c].some((num) => !Number.isFinite(num))) return null;

  if (format === "YMD") return isValidDate(a, b, c);
  if (format === "MDY") return isValidDate(c, a, b);
  if (format === "DMY") return isValidDate(c, b, a);
  return null;
}

/** 解析金額字串：容忍千分位逗號、NT$/$ 貨幣符號、括號負數（會計格式），回傳帶正負號的數字 */
export function parseCsvAmount(raw: string): number | null {
  let v = raw.trim();
  if (!v) return null;

  let negative = false;
  if (v.startsWith("(") && v.endsWith(")")) {
    negative = true;
    v = v.slice(1, -1);
  }
  v = v.replace(/[,$\s]/g, "").replace(/^NT/i, "");
  if (v.startsWith("-")) {
    negative = true;
    v = v.slice(1);
  } else if (v.startsWith("+")) {
    v = v.slice(1);
  }

  if (!/^\d+(\.\d+)?$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return null;
  return negative ? -n : n;
}

export type ImportTypeMode = "ALL_INCOME" | "ALL_EXPENSE" | "SIGN_BASED";

export interface ImportMapping {
  dateColumn: number;
  amountColumn: number;
  noteColumn: number | null;
  dateFormat: CsvDateFormat;
  typeMode: ImportTypeMode;
}

export interface ImportedRow {
  type: "INCOME" | "EXPENSE";
  amount: number;
  occurredAt: Date;
  note: string | null;
}

export interface ImportRowError {
  rowIndex: number; // 1-based，對應資料列（不含表頭）
  message: string;
}

export interface ImportResult {
  rows: ImportedRow[];
  errors: ImportRowError[];
}

/** 依欄位對應把原始 CSV 資料列轉成可寫入的交易紀錄；單筆解析失敗只跳過該筆，不影響其他列 */
export function buildImportRows(dataRows: string[][], mapping: ImportMapping): ImportResult {
  const rows: ImportedRow[] = [];
  const errors: ImportRowError[] = [];

  dataRows.forEach((cols, i) => {
    const rowIndex = i + 1;
    const dateRaw = cols[mapping.dateColumn] ?? "";
    const amountRaw = cols[mapping.amountColumn] ?? "";
    const noteRaw = mapping.noteColumn !== null ? (cols[mapping.noteColumn] ?? "").trim() : "";

    const date = parseCsvDate(dateRaw, mapping.dateFormat);
    if (!date) {
      errors.push({ rowIndex, message: `日期無法解析：「${dateRaw}」` });
      return;
    }
    const amount = parseCsvAmount(amountRaw);
    if (amount === null) {
      errors.push({ rowIndex, message: `金額無法解析：「${amountRaw}」` });
      return;
    }

    let type: "INCOME" | "EXPENSE";
    if (mapping.typeMode === "ALL_INCOME") type = "INCOME";
    else if (mapping.typeMode === "ALL_EXPENSE") type = "EXPENSE";
    else type = amount >= 0 ? "INCOME" : "EXPENSE";

    rows.push({
      type,
      amount: Math.abs(amount),
      occurredAt: date,
      note: noteRaw || null,
    });
  });

  return { rows, errors };
}
