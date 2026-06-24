import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google 等 OAuth 登入跳轉回來時，用授權碼換取登入 session
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 失敗就導回登入頁並帶錯誤訊息
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
