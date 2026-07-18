-- 定期請款（retainer）：應收款可以不掛報價單，改直接掛客戶；新增每月自動產生的定期請款設定

ALTER TYPE "ReceivableKind" ADD VALUE 'RECURRING';

ALTER TABLE "receivables" ALTER COLUMN "quoteId" DROP NOT NULL;
ALTER TABLE "receivables" ADD COLUMN "clientId" TEXT;
ALTER TABLE "receivables" ADD COLUMN "title" TEXT;

ALTER TABLE "receivables" ADD CONSTRAINT "receivables_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "receivables_clientId_idx" ON "receivables"("clientId");

CREATE TABLE "recurring_receivables" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "dueInDays" INTEGER NOT NULL DEFAULT 14,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedYearMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_receivables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurring_receivables_userId_idx" ON "recurring_receivables"("userId");

ALTER TABLE "recurring_receivables" ADD CONSTRAINT "recurring_receivables_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_receivables" ADD CONSTRAINT "recurring_receivables_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_receivables" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_receivables_owner" ON "recurring_receivables"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
