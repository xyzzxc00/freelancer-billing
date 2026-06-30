-- 內部系統日誌，記錄每次成功寄信的時間，用來監控當日 Resend 寄送量
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- 純內部記錄，不經由 Supabase anon client 存取，僅供伺服器端 Prisma 直連使用
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;
