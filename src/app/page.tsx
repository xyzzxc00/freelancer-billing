import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "讓接案這件事，記帳跟報價都輕鬆一點",
  description:
    "接案帳本是給自由接案者跟小型工作室的輕量工具：開報價單、線上簽署、追蹤待收款、記錄收支——不用再用 Excel 東拼西湊。",
  alternates: {
    canonical: siteUrl,
  },
};

const faqs = [
  {
    question: "接案帳本適合誰使用？",
    answer: "適合自由接案者、SOHO 工作者與小型工作室，用來管理客戶、報價單、收支與待收款項目。",
  },
  {
    question: "報價單可以線上簽署嗎？",
    answer: "可以。建立報價單後會產生一個連結，客戶不用安裝任何軟體，直接在瀏覽器上接受報價。",
  },
  {
    question: "報價單接受後會自動變成待收款嗎？",
    answer: "會。報價單一經客戶接受，會自動轉成待收款項目，逾期未收款會清楚標示提醒。",
  },
  {
    question: "收支報表可以匯出嗎？",
    answer: "可以，年度收支報表能一鍵匯出 CSV，方便交給會計師處理。",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteName,
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "給自由接案者跟小型工作室的輕量記帳與報價工具：開報價單、線上簽署、追蹤待收款、記錄收支，年度報表一鍵匯出。",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TWD",
  },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  },
};

const features = [
  {
    title: "客戶與案件管理",
    description: "每個客戶的聯絡資訊、合作歷史都在一個地方，開新案子不用重新建檔。",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: "報價單與線上簽署",
    description: "選客戶、加項目自動算總額，含稅/未稅/勞務報酬試算，產生連結讓客戶免安裝直接線上接受。",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "收款追蹤",
    description: "報價單一接受就自動轉成待收款項目，逾期沒收到款項會清楚標示提醒。",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "收支記錄與報表",
    description: "收入、支出各自分類管理，固定收入支出可設定自動產生，年度報表一鍵匯出 CSV 給會計師。",
    icon: (
      <path
        d="M5 19V10M11 19V5M17 19v-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <span className="text-base font-medium">接案帳本</span>
        <Link
          href="/login"
          className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          登入
        </Link>
      </header>

      <section className="flex flex-col items-center text-center px-4 sm:px-6 py-20">
        <h1 className="text-3xl sm:text-4xl font-medium leading-tight max-w-2xl">
          讓接案這件事，記帳跟報價都輕鬆一點
        </h1>
        <p className="text-foreground-muted mt-4 max-w-lg leading-relaxed">
          給自由接案者跟小型工作室的輕量工具。開報價單、追蹤待收款、記錄收支——不用再用 Excel 東拼西湊。
        </p>
        <div className="flex items-center gap-3 mt-8">
          <Link
            href="/login?mode=signup"
            className="bg-accent text-accent-foreground rounded-md px-6 py-2.5 text-sm font-medium"
          >
            註冊
          </Link>
          <Link
            href="/login"
            className="border border-border rounded-md px-6 py-2.5 text-sm hover:bg-surface"
          >
            登入
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 max-w-5xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="border border-border rounded-lg p-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-accent mb-3" aria-hidden="true">
                {f.icon}
              </svg>
              <h3 className="text-base font-medium mb-1.5">{f.title}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 max-w-3xl w-full mx-auto">
        <h2 className="text-xl font-medium mb-6 text-center">常見問題</h2>
        <div className="flex flex-col gap-5">
          {faqs.map((f) => (
            <div key={f.question}>
              <h3 className="text-base font-medium mb-1.5">{f.question}</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 sm:px-6 py-8 border-t border-border flex justify-between items-center text-sm text-foreground-muted">
        <span>接案帳本</span>
        <Link href="/privacy" className="hover:text-foreground">
          隱私權政策
        </Link>
      </footer>
    </div>
  );
}
