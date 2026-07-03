-- 收款帳戶資訊，用於請款單 PDF 自動帶入

ALTER TABLE "profiles" ADD COLUMN "bankName" TEXT;
ALTER TABLE "profiles" ADD COLUMN "bankBranch" TEXT;
ALTER TABLE "profiles" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "profiles" ADD COLUMN "bankAccountHolder" TEXT;
