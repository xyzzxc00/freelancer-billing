import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// next 只允許站內相對路徑，避免被用來做開放重導向（open redirect）釣魚
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

// Google 等 OAuth 登入跳轉回來時，用授權碼換取登入 session
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

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
