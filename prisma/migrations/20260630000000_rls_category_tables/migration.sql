-- 補齊目錄表的 RLS 保護
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "income_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recurring_expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recurring_incomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quote_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quote_template_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_owner" ON "expense_categories"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "income_categories_owner" ON "income_categories"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "recurring_expenses_owner" ON "recurring_expenses"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "recurring_incomes_owner" ON "recurring_incomes"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "quote_templates_owner" ON "quote_templates"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "quote_template_items_via_template" ON "quote_template_items"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "quote_templates" qt
      WHERE qt.id = "quote_template_items"."templateId"
        AND qt."userId" = auth.uid()::text
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM "quote_templates" qt
      WHERE qt.id = "quote_template_items"."templateId"
        AND qt."userId" = auth.uid()::text
    )
  );
