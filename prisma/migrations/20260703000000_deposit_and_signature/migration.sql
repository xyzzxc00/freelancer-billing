-- 報價支援訂金/尾款分期收款、客戶接受時記錄簽署姓名

ALTER TABLE "quotes" ADD COLUMN "depositPercent" INTEGER;
ALTER TABLE "quotes" ADD COLUMN "signerName" TEXT;

CREATE TYPE "ReceivableKind" AS ENUM ('FULL', 'DEPOSIT', 'FINAL');
ALTER TABLE "receivables" ADD COLUMN "kind" "ReceivableKind" NOT NULL DEFAULT 'FULL';

-- 原本 quoteId 是 unique（一張報價只能有一筆待收款），改成一對多以支援訂金+尾款兩筆
DROP INDEX "receivables_quoteId_key";
CREATE INDEX "receivables_quoteId_idx" ON "receivables"("quoteId");
