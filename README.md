# 接案帳本

自由接案者與一人公司的業務工具：報價、線上簽署、收款、收支記錄與報稅試算。

使用 Next.js App Router、React、Tailwind CSS、Prisma 與 Supabase，部署於 Vercel。GitHub 保存程式碼；帳號、帳務資料及憑證附件由 Supabase 保存。

## 換電腦或重新下載

程式、文章、圖片、PDF 字型、測試與資料庫 migration 都在本儲存庫。重新下載後仍須安裝套件並補回環境設定。**刪除舊資料夾前，先將 `.env` 存入密碼管理器或專案資料夾以外的加密備份。**

完整清單及設定取回方式見 [備份與恢復指南](docs/recovery.md)；維護上的既有約定見 [維護筆記](docs/maintenance.md)。

### 1. 安裝 Git 與 Node.js 24

Node.js 版本與現有 CI / Vercel 對齊，`.nvmrc` 也記錄了版本。使用 `git clone` 可保留後續 commit / push 所需的 Git 設定；GitHub 的 Download ZIP 不包含 `.git`。

```bash
git clone https://github.com/xyzzxc00/freelancer-billing.git
cd freelancer-billing
```

### 2. 還原環境設定

有舊 `.env` 備份時，放回專案根目錄即可。沒有備份時，先建立設定檔，再依 [環境變數清單](docs/recovery.md#環境變數清單) 填入自己的值。

Windows PowerShell（僅在 `.env` 不存在時執行）：

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

macOS / Linux：

```bash
test -f .env || cp .env.example .env
```

範本不含真實金鑰；本機 `NEXT_PUBLIC_SITE_URL` 使用 `http://localhost:3000`。不需要測試寄信時，讓 `RESEND_API_KEY` 留空。Supabase URL、anon key 和資料庫連線仍需填入才能使用登入及帳務功能。

### 3. 安裝並啟動

```bash
npm install
npm run dev
```

安裝時的 `postinstall` 會執行 `prisma generate`，產生 Prisma client，不會修改資料庫。開啟 [http://localhost:3000](http://localhost:3000)。Windows 也可在安裝後執行「啟動開發伺服器.bat」，不依賴舊電腦的資料夾路徑。

**沿用既有 Supabase 專案不需要重新建表。不要為了換電腦執行 `prisma migrate dev`、`migrate reset` 或 `db push`。** 若本機連到正式資料庫，在網站上的編輯、刪除操作仍會改動正式資料，開發測試應使用獨立測試資料庫。

## 驗證與更新網站

```bash
npm test
npx tsc --noEmit
npm run lint
npx next build
```

`npx next build` 只建置應用程式。本專案的 **`npm run build` 還會先執行 `prisma migrate deploy`**（Vercel 非 production 環境除外），一般本機驗證使用前者。

修改後檢查 `git status` 與 diff，只加入本次要發布的檔案，commit 後執行：

```bash
git push origin main
```

需先登入有儲存庫寫入權限的 GitHub 帳號。既有 Vercel 專案 `freelancer-billing` 連接此儲存庫的 `main`，push 後會自動部署，不需要重建 Vercel 專案或改網域。完成後確認同一筆 commit 的 GitHub Actions 和 Vercel 部署均成功。

目前 CI 使用 `npm install`；此相依樹曾發生跨平台 optional dependency lockfile 問題，切換安裝方式前需在乾淨的 Windows / Linux 環境驗證。Google Fonts 建置時需要網路，PDF 中文字型則已放在 `src/fonts/`。
