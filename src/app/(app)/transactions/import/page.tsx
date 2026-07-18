import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { CsvImportForm } from "@/components/CsvImportForm";
import { resolveImportSourcePath, type ImportSource } from "@/lib/import-source";

export default async function ImportTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireUserId();
  const { from } = await searchParams;
  const backHref = resolveImportSourcePath(from);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-3xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">CSV 匯入</h1>
        <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground">
          返回
        </Link>
      </div>
      <p className="text-sm text-foreground-muted mb-6">
        上傳銀行對帳單或其他來源的 CSV，選好欄位對應後即可批次建立收支記錄。格式看起來不對的列會自動略過，不會中斷整批匯入。
      </p>
      <CsvImportForm from={from === "income" || from === "expenses" ? (from as ImportSource) : undefined} />
    </div>
  );
}
