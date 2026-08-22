import type { Metadata } from "next";

// page.tsx 是 client component 不能 export metadata，放在 layout 補上
export const metadata: Metadata = {
  title: "登入",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
