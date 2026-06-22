-- CreateTable
CREATE TABLE "income_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_incomes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "categoryId" TEXT,
    "dayOfMonth" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedYearMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_incomes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "incomeCategoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_userId_name_key" ON "income_categories"("userId", "name");
CREATE INDEX "income_categories_userId_idx" ON "income_categories"("userId");
CREATE INDEX "recurring_incomes_userId_idx" ON "recurring_incomes"("userId");
CREATE INDEX "transactions_incomeCategoryId_idx" ON "transactions"("incomeCategoryId");

-- AddForeignKey
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_incomes" ADD CONSTRAINT "recurring_incomes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_incomes" ADD CONSTRAINT "recurring_incomes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "income_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_incomeCategoryId_fkey" FOREIGN KEY ("incomeCategoryId") REFERENCES "income_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS
ALTER TABLE "income_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recurring_incomes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_categories_owner" ON "income_categories"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "recurring_incomes_owner" ON "recurring_incomes"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
