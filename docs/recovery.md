# 備份與恢復指南

此儲存庫公開。目標是讓程式、文件與可重建的設定完整保存在 GitHub，真實金鑰及客戶資料留在專用服務或加密備份。

## 哪些東西在哪裡

| 內容 | 保存位置 | 刪除本機後怎麼恢復 |
| --- | --- | --- |
| 程式、測試、套件清單與 lockfile | GitHub | `git clone` 後 `npm install` |
| 文章、公開圖片、網站圖示、PDF 中文字型 | GitHub 的 `content/`、`public/`、`src/fonts/` | 隨 clone 下載 |
| 資料庫結構、RLS、trigger、Storage bucket 建立規則 | `prisma/schema.prisma`、`prisma/migrations/` | 隨 clone 下載；沿用既有資料庫不必重跑初始化 |
| 環境變數名稱與用途 | `.env.example`、本文件 | 隨 clone 下載，但不含真實值 |
| 本機 Supabase 連線密碼、管理 token | `.env`，刻意不進 Git | 刪除前另存密碼管理器或資料夾外的加密備份 |
| 正式站環境變數 | Vercel 專案設定 | 原專案繼續供部署使用；Secret / Sensitive 值不能取回原文 |
| 帳號、客戶、報價、收支記錄 | Supabase Auth / PostgreSQL | 原雲端專案保留；不是 GitHub 檔案 |
| 上傳的憑證照片／PDF | Supabase Storage 的私有 `receipts` bucket | 原 bucket 保留；不在 GitHub |
| 網域與 DNS、Google OAuth、寄信網域驗證 | 各服務控制台 | 沿用原帳號與專案；設定不會因 clone 自動搬到新服務 |
| `.next/`、`node_modules/`、`next-env.d.ts`、`*.tsbuildinfo` | 本機產物 | 安裝／建置時重新產生，不需備份 |
| `.vercel/`、`supabase/.temp/` | CLI 本機專案連結／快取 | 必要時重新登入及連結原專案 |
| `.env.local` 的 `VERCEL_OIDC_TOKEN` | CLI 短期憑證 | 重新登入／執行對應工具取得，不作長期備份 |
| `.claude/settings.local.json`、`.agents/` | 本機工具設定／鏡像 | 網站不依賴；共用指引在 `AGENTS.md`、`.claude/skills/` 及 `docs/` |

`backups/`、`private-backup/`、`exports/` 及常見私鑰／資料庫 dump 副檔名已列入 `.gitignore`。忽略規則只減少誤提交，不是加密，也不能保護用其他檔名保存的秘密；提交前仍要檢查 diff。

## 環境變數清單

一般本機開發將值放在根目錄 `.env`。不要只放在 `.env.local`：Next.js 會載入它，但目前 Prisma CLI 的 `.env` 載入方式不同。

| 變數 | 用途／取得方式 | 保留方式 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | 可由 Supabase 控制台重新取得 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key，用於瀏覽器；不可換成 service-role key | 可由 Supabase API 設定取得；本範本只放 placeholder |
| `DATABASE_URL` | 應用程式資料庫連線，從 Supabase Connect 取得 transaction pooler 字串 | 密碼管理器；字串中的密碼要 URL 編碼 |
| `DIRECT_URL` | Prisma CLI 使用的 direct / session pooler 字串 | 密碼管理器；與應用程式連到同一個資料庫 |
| `RESEND_API_KEY` | 寄送報價、提醒及回饋通知 | 密碼管理器；本機不測寄信可留空；遺失原值可建立新 key，但不必因此更動正式站 |
| `RESEND_FROM_EMAIL` | Resend 已驗證寄件網域的寄件人 | 可由寄件網域設定重建 |
| `RESEND_DAILY_LIMIT` | 本程式的每日寄信額度保護 | 選填，程式預設 `90` |
| `ADMIN_EMAIL` | 系統告警與回饋收件人 | 個人設定；填實際收件信箱 |
| `CRON_SECRET` | 驗證排程請求 | 密碼管理器；正式值留在 Vercel，本機留空會拒絕 cron |
| `NEXT_PUBLIC_SITE_URL` | 分享、SEO 與通知中的網址 | 本機 `http://localhost:3000`，正式站使用既有正式網域 |

`NODE_ENV`、`VERCEL_ENV`、`VERCEL_URL` 由框架／部署平台管理。`ANALYZE=true` 是選用的 bundle 分析開關。`VERCEL_API_TOKEN` 是管理工具用的帳號憑證，`VERCEL_OIDC_TOKEN` 是短期憑證；兩者都不是網站執行必要設定，不要提交到 Git。

### 本次檢查的雲端設定（2026-09-11）

已透過 Vercel API 唯讀確認：`freelancer-billing` 連接 GitHub 的 `main`，使用 Node.js `24.x`。Production 已有上述必要應用設定，唯 `RESEND_DAILY_LIMIT` 未設定，使用程式的預設值。Development 沒有專案自訂環境變數。

Production 的資料庫連線、Supabase 設定、Resend key、寄件人、管理員信箱及 cron secret 為 `sensitive`。本機 `.env` 則含 Supabase URL / anon key、兩條資料庫連線、管理員信箱及 `VERCEL_API_TOKEN`，**不是一份完整的正式站環境備份**。本機 `.env.local` 只有 `VERCEL_OIDC_TOKEN`。

Vercel 的 Secret（原 Sensitive）可供部署使用，但儲存後不能讀回原值。因此 `vercel env pull` 不是這個專案的完整救援方案；空的 Development 也不會自動帶出 Production 設定。不要為了下載而降低秘密的保護等級。詳見 [Vercel 敏感環境變數](https://vercel.com/docs/environment-variables/sensitive-environment-variables) 與 [env 指令](https://vercel.com/docs/cli/env)。

以上是日期當下的盤點，不代表服務設定永遠不變。這次沒有更換金鑰、修改雲端環境變數或建立客戶資料備份。

### 重新下載驗證（2026-09-11）

從 GitHub `main` 的 `a702a6a` 另行 clone 到空資料夾，沒有複製原本的 `.env`、`node_modules` 或 `.next`。`npm install` 及 Prisma client 產生成功，lockfile 沒有變更；使用 CI 的假資料庫連線／假金鑰後，123 個測試、型別檢查、lint 及 `npx next build` 全部通過。

這驗證了儲存庫可以獨立安裝及建置；沒有連線正式資料庫、測試真實登入、寄信或還原真實資料。對 Git 可達歷史的 979 份文字 blob 比對目前本機秘密值及常見金鑰格式，未找到符合的秘密；這是限定範圍的檢查，不是所有歷史秘密的保證。

## 刪除資料夾前

1. 確認 GitHub 上已有預期 commit；`git status --short` 應無未提交檔案，`git ls-remote origin refs/heads/main` 的 SHA 應與 `git rev-parse HEAD` 相同。
2. 將 `.env` 存進密碼管理器或專案資料夾以外的加密備份，確認能在新電腦解密。**不要把備份留在準備整個刪除的資料夾內。** 不要把 `.env`、資料庫密碼或 token 貼進 GitHub issue / commit / README。
3. 確認仍能登入 GitHub、Vercel、Supabase、Resend、網域註冊商及 Google OAuth 管理帳號，並妥善保存雙重驗證復原資訊。
4. 若自行存過未提交的設計原稿、帳務匯出或附件，另外盤點。助理在專案外的個人記憶及桌面排程也不屬於網站原始碼。

## 沿用既有網站繼續開發

依 [README](../README.md) clone、還原 `.env`、安裝套件、啟動網站即可。GitHub 權限重新登入後即可 push；原 Vercel 連線與正式環境變數繼續使用，沒有 `.vercel/` 本機快取也能透過 GitHub 自動部署。

若需要 Vercel CLI，登入後連結**既有** `freelancer-billing` 專案。GitHub 更新網站不需要這個額外步驟。不要為了換電腦建立重複的 Vercel 或 Supabase 專案。

本機驗證使用 `npx next build`。`npm run build` 在本機及 Vercel Production 會先執行 `scripts/migrate-deploy.mjs`，可能修改所連線的資料庫；只有 Vercel 非 production 環境會略過 migration。

## 若雲端服務也要重建

這與刪除本機資料夾不同。GitHub 中的 migration 只保存結構，不能還原真實帳務資料、Auth 帳號或附件。

- 新的資料庫需要 Supabase 的 Auth / Storage 系統結構；這組 migration 不等於任意空白 PostgreSQL 的完整安裝包。
- 原有資料需要額外的資料庫備份；`receipts` 的 Storage 物件也要另行備份。[Supabase 說明](https://supabase.com/docs/guides/platform/backups)明確指出，資料庫備份不包含 Storage 檔案本體。
- Supabase 的登入方式、Site URL、允許的 redirect URLs、Google OAuth 設定與 Resend 寄件網域驗證需在各服務重建。登入／忘記密碼／重設密碼流程完成後應實測。
- Vercel 的 Git 連接、Production branch、環境變數、網域／DNS 設定需重新設定；`vercel.json` 則保存網站的 cron 排程。

備份檔包含客戶及帳務資料，請使用受控加密儲存，不能放進本公開儲存庫。
