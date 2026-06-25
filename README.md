# 接案帳本

自由工作者專用的報價、收款、收支記帳系統。

## 技術棧

- **Framework:** Next.js (App Router) + React 19
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **Auth:** Supabase Auth (Google OAuth)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

## 本地開發

**1. 安裝相依套件**

```bash
npm install
```

**2. 設定環境變數**

複製 `.env.example` 為 `.env`，填入 Supabase 連線資訊：

```bash
cp .env.example .env
```

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Supabase pooler 連線（port 6543） |
| `DIRECT_URL` | Supabase direct 連線（port 5432，僅 migration 用） |
| `CRON_SECRET` | Cron job 驗證金鑰（Vercel 環境需設定） |

**3. 執行資料庫 migration**

```bash
npx prisma migrate dev
```

**4. 啟動開發伺服器**

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

## 部署

推送到 `main` branch 後 Vercel 會自動部署。

Vercel 環境變數需額外設定 `CRON_SECRET`，並確認 Supabase 允許該 IP 連線。
