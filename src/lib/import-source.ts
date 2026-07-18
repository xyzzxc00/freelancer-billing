// CSV 匯入頁的「返回」目的地：從入口帶 from 參數過來，白名單對照成固定路徑，
// 不直接把使用者輸入的字串當 redirect 路徑用，避免 open redirect
export type ImportSource = "income" | "expenses";

const SOURCE_PATH: Record<ImportSource, string> = {
  income: "/income",
  expenses: "/expenses",
};

export function resolveImportSourcePath(from: string | undefined | null): string {
  if (from === "income" || from === "expenses") return SOURCE_PATH[from];
  return "/dashboard";
}
