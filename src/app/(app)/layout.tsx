import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ToastListener } from "@/components/ToastListener";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
    select: { name: true, email: true },
  });

  // Google 等 OAuth 登入會把名字/頭像放在 user_metadata，沒設定自訂名稱時就用它
  const meta = data.user.user_metadata ?? {};
  const displayName =
    profile?.name || meta.full_name || meta.name || profile?.email || "U";
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;

  return (
    <div className="max-w-7xl w-full mx-auto pb-16 md:pb-0">
      <Suspense fallback={null}>
        <ToastListener />
      </Suspense>
      <TopNav displayName={displayName} avatarUrl={avatarUrl} />
      {children}
      <BottomNav />
    </div>
  );
}
