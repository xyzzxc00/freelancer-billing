"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import {
  parseCsvText,
  dateFormatLabel,
  MAX_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
  type CsvDateFormat,
  type ImportTypeMode,
} from "@/lib/csv-import";
import { importTransactionsAction } from "@/app/(app)/transactions/import/actions";

const PREVIEW_ROWS = 5;

export function CsvImportForm() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const [dateColumn, setDateColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");
  const [noteColumn, setNoteColumn] = useState("");
  const [dateFormat, setDateFormat] = useState<CsvDateFormat>("YMD");
  const [typeMode, setTypeMode] = useState<ImportTypeMode>("SIGN_BASED");

  const [state, formAction] = useActionState(importTransactionsAction, undefined);

  async function handleFile(file: File) {
    setFileError(null);
    setFileName(file.name);
    setHeaders([]);
    setDataRows([]);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `檔案太大了（${Math.round(file.size / 1024)}KB，上限約 ${Math.round(MAX_FILE_SIZE_BYTES / 1024)}KB），請分批匯入或先刪減不需要的欄位／列數`
      );
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      if (rows.length < 2) {
        setFileError("這個檔案看起來沒有資料列（至少需要表頭 + 1 筆資料）");
        return;
      }
      if (rows.length - 1 > MAX_IMPORT_ROWS) {
        setFileError(`這個檔案有 ${rows.length - 1} 列資料，一次最多匯入 ${MAX_IMPORT_ROWS} 筆，請分批匯入`);
        return;
      }
      setHeaders(rows[0]);
      setDataRows(rows.slice(1));
      setDateColumn("");
      setAmountColumn("");
      setNoteColumn("");
    } catch (err) {
      console.error("讀取 CSV 失敗:", err);
      setFileError("讀取檔案失敗，請確認是合法的 CSV 檔");
    }
  }

  const ready = headers.length > 0 && dateColumn !== "" && amountColumn !== "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">選擇 CSV 檔案</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full file:mr-3 file:border-0 file:bg-surface file:rounded file:px-3 file:py-1 file:text-sm"
        />
        {fileError && <p className="text-sm text-[color:var(--danger-fg)] mt-1">{fileError}</p>}
      </div>

      {headers.length > 0 && (
        <>
          <div>
            <p className="text-sm text-foreground-muted mb-2">
              {fileName} · 共 {dataRows.length} 列資料，預覽前 {Math.min(PREVIEW_ROWS, dataRows.length)} 列
            </p>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface text-foreground-muted">
                    {headers.map((h, i) => (
                      <th key={i} className="text-left px-2.5 py-1.5 whitespace-nowrap">
                        {h || `欄位 ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {headers.map((_, j) => (
                        <td key={j} className="px-2.5 py-1.5 whitespace-nowrap">
                          {row[j] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="rows" value={JSON.stringify(dataRows)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground-muted block mb-1">日期欄位</label>
                <select
                  name="dateColumn"
                  required
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                >
                  <option value="" disabled>
                    選擇欄位
                  </option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `欄位 ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-foreground-muted block mb-1">日期格式</label>
                <select
                  name="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as CsvDateFormat)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                >
                  {Object.entries(dateFormatLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-foreground-muted block mb-1">金額欄位</label>
                <select
                  name="amountColumn"
                  required
                  value={amountColumn}
                  onChange={(e) => setAmountColumn(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                >
                  <option value="" disabled>
                    選擇欄位
                  </option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `欄位 ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-foreground-muted block mb-1">備註欄位（選填）</label>
                <select
                  name="noteColumn"
                  value={noteColumn}
                  onChange={(e) => setNoteColumn(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                >
                  <option value="">不使用</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `欄位 ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground-muted block mb-1.5">收支判斷方式</label>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["SIGN_BASED", "依金額正負判斷（正數＝收入、負數＝支出）"],
                    ["ALL_EXPENSE", "整份都是支出"],
                    ["ALL_INCOME", "整份都是收入"],
                  ] as [ImportTypeMode, string][]
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="typeMode"
                      value={value}
                      checked={typeMode === value}
                      onChange={() => setTypeMode(value)}
                      className="accent-accent"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <FormError message={state?.error} />
            <SubmitButton className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium self-start px-6">
              {ready ? `匯入 ${dataRows.length} 筆資料` : "匯入"}
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
