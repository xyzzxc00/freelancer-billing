// Vercel 的 preview/development 部署與 production 共用同一個 build 指令，
// 若不擋下來，未合併的 PR（含 Dependabot）建 preview 時會把 migration 直接打進正式資料庫。
// 本機開發（沒有 VERCEL_ENV）維持原行為，照常執行 migrate deploy。
import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;
if (vercelEnv && vercelEnv !== "production") {
  console.log(`VERCEL_ENV=${vercelEnv}，非 production 部署，略過 prisma migrate deploy`);
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
