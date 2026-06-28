import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Middleware already validates the user via getUser() at the Edge.
// Here we use getSession() which reads from the cookie without a network round-trip,
// making server component rendering significantly faster.
export const requireUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user.id;
});
