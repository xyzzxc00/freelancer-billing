# 維護筆記

這份文件保存跟著 GitHub 走的維護約定，避免換電腦後只能依賴助理的本機記憶。歷史記錄是調查起點；若與目前程式或測試結果衝突，以新證據為準。

## 開發與部署

- 先讀 `AGENTS.md` 及已安裝 Next.js 的 `node_modules/next/dist/docs/`，不要直接套用舊版框架慣例。
- 本機驗證順序：`npm test`、`npx tsc --noEmit`、`npm run lint`、`npx next build`。最後一個指令不執行專案的 migration wrapper。
- push 會觸發 Vercel 部署。由助理修改時，依當次使用者的發布授權執行；有授權後，要查同一 SHA 的 GitHub Actions 與 Vercel 狀態，不能只確認 push 指令成功。
- CI / Vercel 使用 Node 24。CI 目前使用 `npm install`；2026-08-22 切換 `npm ci` 時，Linux CI 曾因 `@emnapi/core` / `runtime` optional dependencies 的 lockfile 缺項失敗。本機安裝成功不足以證明跨平台成功，未來調整時需在乾淨環境重新驗證。
- `.github/dependabot.yml` 記錄目前暫緩的大版本更新。升級前重看當時的相容性；合併 Dependabot PR 前確認**當下**的 diff 與 CI，不沿用早前版本的結果。
- 正式資料庫結構修改保存在 `prisma/migrations/`。換電腦不是執行資料庫初始化或 reset 的理由。

## 避免把既有設計當成缺漏

- Next.js 的認證入口在 `src/proxy.ts`，不是 `middleware.ts`。
- `(app)` 是 route group，不會出現在 URL。報表／PDF routes 的 URL 不一定帶 `/api`；檢查權限時同時看 proxy 和 handler 的使用者範圍。
- 首頁及 guides 使用靜態生成，登入按鈕在 `src/components/AuthNavButton.tsx` 讀取瀏覽器 session。加入伺服器端 cookie 讀取前，要確認對靜態生成的影響。
- 公開接案頁 `/p/[slug]` 與客戶報價連結 `/quote/[token]` 的索引需求不同；前者用於曝光，後者含商務資料。
- 字型位於 `src/fonts/`，PDF／OG 圖建置會用到，不能當成本機快取移除。
- `src/lib/email.ts` 的節流佇列是在單一執行個體內運作；不要把它描述為跨多個 serverless 執行個體的全域鎖。
- `vercel.json` 的 cron 是部署端排程，不需要本機開機；助理工具的本機定期健檢則是另外的設定，不會隨 GitHub 自動恢復。

## 記錄完成項目

有意義的變更在 commit 描述記錄原因與驗證結果；需要長期保留的維護決策更新本文件。區分單元測試、建置、瀏覽器實測與正式環境驗證，不把未做的驗證寫成完成。過去健康檢查的個人記憶可作參考，不必複製整份帶私人資訊的對話進公開儲存庫。
