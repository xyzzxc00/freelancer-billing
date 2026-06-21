-- 開啟 RLS
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quote_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receivables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;

-- profiles：只能看到/修改自己的 profile
CREATE POLICY "profiles_self" ON "profiles"
  FOR ALL USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

-- clients：只能存取自己名下的客戶
CREATE POLICY "clients_owner" ON "clients"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- quotes：僅限本人（登入後）透過 anon key 存取自己的報價單
-- 公開報價單分享頁一律走伺服器端 Prisma（以 postgres 角色直連，不受 RLS 限制），
-- 由應用程式以 shareToken 過濾，因此這裡不開放 anon 角色的公開讀取 policy。
CREATE POLICY "quotes_owner" ON "quotes"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- quote_items：跟著對應 quote 的擁有者權限走
CREATE POLICY "quote_items_via_quote" ON "quote_items"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "quotes" q WHERE q.id = "quote_items"."quoteId" AND q."userId" = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "quotes" q WHERE q.id = "quote_items"."quoteId" AND q."userId" = auth.uid()::text)
  );

-- receivables：只能存取自己的待收款
CREATE POLICY "receivables_owner" ON "receivables"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- transactions：只能存取自己的收支記錄
CREATE POLICY "transactions_owner" ON "transactions"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
