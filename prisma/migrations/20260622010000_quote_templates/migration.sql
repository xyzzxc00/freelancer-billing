-- CreateTable
CREATE TABLE "quote_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_templates_userId_idx" ON "quote_templates"("userId");

-- CreateIndex
CREATE INDEX "quote_template_items_templateId_idx" ON "quote_template_items"("templateId");

-- AddForeignKey
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quote_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "quote_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quote_template_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_templates_owner" ON "quote_templates"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "quote_template_items_via_template" ON "quote_template_items"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "quote_templates" t WHERE t.id = "quote_template_items"."templateId" AND t."userId" = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "quote_templates" t WHERE t.id = "quote_template_items"."templateId" AND t."userId" = auth.uid()::text)
  );
