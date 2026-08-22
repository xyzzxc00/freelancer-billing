import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ContentHeader } from "@/components/ContentHeader";
import { ToastListener } from "@/components/ToastListener";
import { GlobalKeyboardShortcuts } from "@/components/GlobalKeyboardShortcuts";
import { FeedbackFab } from "@/components/FeedbackFab";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // proxy.ts 已對每個請求跑過 getUser() 驗證，這裡用 getSession()（只讀 cookie）
  // 就好，避免每次頁面導覽都多一次 Supabase 網路往返——與 lib/auth.ts 的
  // requireUserId 是同一套理由
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user;

  const [profile, incomeCategories, expenseCategories] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
    prisma.incomeCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.expenseCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const meta = user.user_metadata ?? {};
  const displayName =
    profile?.name || meta.full_name || meta.name || profile?.email || "U";
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Suspense fallback={null}>
        <ToastListener />
      </Suspense>
      <Sidebar
        displayName={displayName}
        avatarUrl={avatarUrl}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <ContentHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <GlobalKeyboardShortcuts />
      <FeedbackFab />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  );
}
