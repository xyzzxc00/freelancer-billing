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
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
    select: { name: true, email: true },
  });

  const meta = data.user.user_metadata ?? {};
  const displayName =
    profile?.name || meta.full_name || meta.name || profile?.email || "U";
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Suspense fallback={null}>
        <ToastListener />
      </Suspense>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} />
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
