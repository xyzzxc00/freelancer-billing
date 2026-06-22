-- handle_new_user 只應該被 auth.users 的 INSERT trigger 自動呼叫，
-- 不該讓任何角色可以直接手動執行（它是 SECURITY DEFINER，會繞過 RLS）
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- rls_auto_enable 是 Supabase 專案設定「自動為新表啟用 RLS」的內部函式，
-- 同樣只該由事件觸發器呼叫，不該公開可執行
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
