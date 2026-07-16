"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirectWithToast } from "@/lib/toast";
import { buildImportRows, type CsvDateFormat, type ImportTypeMode } from "@/lib/csv-import";
import { GENERIC_ACTION_ERROR, type ActionResult } from "@/lib/action-state";

const MAX_ROWS = 1000;

export async function importTransactionsAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  let dataRows: string[][];
  try {
    dataRows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { error: "檔案資料格式錯誤，請重新上傳" };
  }
  if (!Array.isArray(dataRows) || dataRows.length === 0) {
    return { error: "沒有可匯入的資料列" };
  }
  if (dataRows.length > MAX_ROWS) {
    return { error: `一次最多匯入 ${MAX_ROWS} 筆，請分批匯入` };
  }

  const dateColumn = Number(formData.get("dateColumn"));
  const amountColumn = Number(formData.get("amountColumn"));
  const noteColumnRaw = String(formData.get("noteColumn") ?? "");
  const noteColumn = noteColumnRaw === "" ? null : Number(noteColumnRaw);
  const dateFormat = String(formData.get("dateFormat") ?? "") as CsvDateFormat;
  const typeMode = String(formData.get("typeMode") ?? "") as ImportTypeMode;

  if (!Number.isInteger(dateColumn) || !Number.isInteger(amountColumn)) {
    return { error: "請選擇日期與金額對應的欄位" };
  }
  if (!["YMD", "YMD_COMPACT", "MDY", "DMY"].includes(dateFormat)) {
    return { error: "請選擇日期格式" };
  }
  if (!["ALL_INCOME", "ALL_EXPENSE", "SIGN_BASED"].includes(typeMode)) {
    return { error: "請選擇收支判斷方式" };
  }

  const { rows, errors } = buildImportRows(dataRows, {
    dateColumn,
    amountColumn,
    noteColumn,
    dateFormat,
    typeMode,
  });

  if (rows.length === 0) {
    return { error: "沒有成功解析的資料列，請確認欄位對應與日期格式是否正確" };
  }

  try {
    await prisma.transaction.createMany({
      data: rows.map((r) => ({
        userId,
        type: r.type,
        amount: r.amount,
        occurredAt: r.occurredAt,
        note: r.note,
      })),
    });
  } catch (err) {
    console.error("CSV 匯入失敗:", err);
    return { error: GENERIC_ACTION_ERROR };
  }

  const message =
    errors.length > 0
      ? `已匯入 ${rows.length} 筆，${errors.length} 筆格式錯誤已略過`
      : `已匯入 ${rows.length} 筆`;
  redirectWithToast("/dashboard", message);
}
