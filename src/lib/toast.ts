import { redirect } from "next/navigation";

export function redirectWithToast(path: string, message: string, type: "success" | "error" = "success"): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}toast=${encodeURIComponent(message)}&toastType=${type}`);
}
