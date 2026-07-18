import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteName, siteUrl } from "@/lib/site";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: {
    absolute: "接案帳本 - 接案的錢，一條線管好",
  },
  description:
    "接案帳本是給自由接案者、一人公司與 SOHO 的接案業務工具：開報價單、線上簽署、訂金尾款拆分、追蹤催款、報稅試算——不用再用 Excel 東拼西湊。",
  alternates: {
    canonical: siteUrl,
  },
};

const faqs = [
  {
    question: "接案帳本適合誰使用？",
    answer:
      "適合自由接案者、SOHO、一人公司與接業配的創作者，用來管理客戶、報價單、收款與報稅。由一個人統一管理報價與收款的小型工作室也很適合。",
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

// SoftwareApplication 與 FAQPage 各自作為頂層節點，
// FAQPage 巢狀在 mainEntity 底下的話 Google 不保證解析得到
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: siteName,
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "給自由接案者、一人公司與 SOHO 的接案業務工具：報價單線上簽署、訂金尾款拆分、待收款催款、收支記錄與報稅試算——接案的錢，一條線管好。",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
      },
    },
    {
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
  ],
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
    description: "選客戶、加項目自動算總額，含稅/未稅/勞務報酬試算，可設定訂金比例，產生連結讓客戶免安裝直接線上接受。",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "收款追蹤與催款",
    description: "報價單一接受就自動拆成訂金與尾款待收款，逾期清楚標示，一鍵寄催款信；月費客戶可設定每月自動請款。",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "收支記錄與報稅",
    description: "收款自動記進收入，年度報表一鍵匯出 CSV，內建勞務報酬與所得稅試算，報稅季不再手忙腳亂。",
    icon: (
      <path
        d="M5 19V10M11 19V5M17 19v-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "接案頁與詢價",
    description: "一頁式公開接案頁展示你的服務，潛在客戶直接留下詢價，一鍵轉成客戶並開報價單。",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: "客戶付款狀況",
    description: "每個客戶的平均回款天數、準時與逾期記錄一目了然，接新案前先看狀況再談條件。",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 12.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
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
        <div className="flex items-center gap-4 sm:gap-5">
          <Link href="/guides" className="text-sm text-foreground-muted hover:text-foreground">
            接案知識庫
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            登入
          </Link>
        </div>
      </header>

      <main>
      <section className="flex flex-col items-center text-center px-4 sm:px-6 py-20">
        <h1 className="text-3xl sm:text-4xl font-medium leading-tight max-w-2xl">
          接案的錢，一條線管好
        </h1>
        <p className="text-foreground-muted mt-4 max-w-lg leading-relaxed">
          報價、簽署、訂金、催款、報稅——給自由接案者與一人公司的業務工具，不用再用 Excel 東拼西湊。
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

      <section className="px-4 sm:px-6 py-16 max-w-5xl w-full mx-auto" aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">核心功能</h2>
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

      </main>
      <footer className="px-4 sm:px-6 py-8 border-t border-border flex justify-between items-center text-sm text-foreground-muted">
        <span>接案帳本</span>
        <Link href="/privacy?from=home" className="hover:text-foreground">
          隱私權政策
        </Link>
      </footer>
    </div>
  );
}
