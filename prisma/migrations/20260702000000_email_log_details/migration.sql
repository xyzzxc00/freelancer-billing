-- 補齊 email_logs 稽核欄位：收件人、主旨、狀態與失敗原因，
-- 讓「這封信到底寄了沒」可以直接查資料庫，不用依賴會過期的 Vercel log。
-- 既有資料列都是成功寄送的紀錄，status 預設 'sent' 即為正確值。
ALTER TABLE "email_logs"
    ADD COLUMN "to" TEXT,
    ADD COLUMN "subject" TEXT,
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'sent',
    ADD COLUMN "error" TEXT;
