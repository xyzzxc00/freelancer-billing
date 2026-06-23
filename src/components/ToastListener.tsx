"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

export function ToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const message = searchParams.get("toast");
  const type = searchParams.get("toastType");

  useEffect(() => {
    if (!message) return;

    if (type === "error") {
      toast.error(message);
    } else {
      toast.success(message);
    }

    const params = new URLSearchParams(searchParams);
    params.delete("toast");
    params.delete("toastType");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, type]);

  return null;
}
