import type { Metadata } from "next";

// page.tsx 是 client component 不能 export metadata，放在 layout 補上。
// robots.txt 已 disallow，這裡再補 noindex meta 雙保險（robots.txt 只擋爬、不保證不收錄）
export const metadata: Metadata = {
  title: "重設密碼",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
