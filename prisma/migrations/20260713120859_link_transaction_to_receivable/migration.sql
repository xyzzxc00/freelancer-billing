-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "receivableId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_receivableId_key" ON "transactions"("receivableId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

