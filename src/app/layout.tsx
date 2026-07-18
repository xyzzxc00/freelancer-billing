import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const themeInitScript = `
  (function () {
    try {
      var theme = localStorage.getItem("theme");
      if (theme === "light" || theme === "dark") {
        document.documentElement.dataset.theme = theme;
      }
    } catch (e) {}
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "給自由接案者、一人公司與 SOHO 的接案業務工具：報價單線上簽署、訂金尾款拆分、待收款催款、收支記錄與報稅試算——接案的錢，一條線管好。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: siteName,
    template: `%s｜${siteName}`,
  },
  description,
  keywords: ["接案", "報價單", "自由工作者", "一人公司", "SOHO", "訂金", "勞務報酬", "記帳", "收支管理", "報表"],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName,
    title: siteName,
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
