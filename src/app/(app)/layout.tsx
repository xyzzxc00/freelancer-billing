import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";

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

  const displayName = profile?.name || profile?.email || "U";

  return (
    <div className="max-w-5xl w-full mx-auto">
      <TopNav displayName={displayName} />
      {children}
    </div>
  );
}
