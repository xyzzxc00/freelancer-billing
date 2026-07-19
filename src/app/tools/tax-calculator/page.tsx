import type { Metadata } from "next";
import Link from "next/link";
import { siteName, siteUrl } from "@/lib/site";
import { LaborIncomeCalculator } from "@/components/LaborIncomeCalculator";
import { TaxEstimator } from "@/components/TaxEstimator";
import { TAX_YEAR_LABEL } from "@/lib/tax-estimate";

export const metadata: Metadata = {
  title: "勞務報酬試算器：10% 代扣＋二代健保 2.11% 線上算",
  description:
    "免費線上試算勞務報酬實拿金額：單筆 2 萬門檻的 10% 所得稅代扣與二代健保補充保費 2.11%，加上 9A/9B 年度所得稅估算，數字依 115 年度財政部公告，免註冊直接算。",
  alternates: {
    canonical: `${siteUrl}/tools/tax-calculator`,
  },
};

const faqs = [
  {
    question: "單筆勞務報酬多少會開始被扣款？",
    answer:
      "二代健保補充保費在單次給付「達」2 萬元（含）時就會被扣 2.11%；所得稅則因為「應扣繳稅額不超過 2,000 元免予扣繳」的規定，單次「超過」2 萬元才會被代扣 10%。所以剛好 2 萬元整的一筆錢，只會被扣健保補充保費、不會被扣所得稅。",
  },
  {
    question: "被代扣的 10% 所得稅是不是繳完就沒事了？",
    answer:
      "不是，那是預先扣繳。隔年 5 月申報綜合所得稅時這筆收入會併入計算，已被代扣的稅額可以抵減應納稅額，多退少補——所得不高的接案者常常可以退回一部分。",
  },
  {
    question: "二代健保補充保費在報稅時可以退回嗎？",
    answer:
      "不行。補充保費是健保保費不是所得稅，不會多退少補。不過如果申報時採用列舉扣除，全民健保保費（含補充保費）可以全數列入保險費列舉扣除額，不受 2 萬 4 千元上限限制。",
  },
  {
    question: "9A 執行業務所得和 9B 稿費差在哪？",
    answer:
      "9B（稿費、演講鐘點費、版稅、作曲等）每人每年合計 18 萬元內免稅，超過的部分還可以減除 30% 費用；9A 則是依財政部每年公布的「執行業務者費用標準」減除，比例依職業別不同（113 年度公告如程式設計師 20%、撰稿類 30%），沒有免稅額度。同一筆錢如果性質符合，報 9B 通常比 9A 划算。",
  },
  {
    question: "兼職薪資也是 2 萬元就要扣二代健保嗎？",
    answer:
      "不是。兼職薪資所得（格式 50）的補充保費起扣點是「基本工資」（115 年起為每月 29,500 元），勞務報酬（執行業務收入，9A/9B）才是 2 萬元。這也是為什麼同一筆錢開成薪資或勞報單，被扣的金額會不一樣。",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "勞務報酬試算器",
      url: `${siteUrl}/tools/tax-calculator`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description:
        "免費線上試算勞務報酬實拿金額：10% 所得稅代扣、二代健保補充保費 2.11%，與 9A/9B 年度所得稅估算。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "勞務報酬試算器",
          item: `${siteUrl}/tools/tax-calculator`,
        },
      ],
    },
  ],
};

export default function TaxCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="text-base font-medium">
          {siteName}
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <Link href="/guides" className="text-sm text-foreground-muted hover:text-foreground">
            接案知識庫
          </Link>
          <Link
            href="/login"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            登入
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-12 max-w-3xl w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl font-medium mb-2">勞務報酬試算器</h1>
        <p className="text-foreground-muted mb-4 leading-relaxed">
          接案收款前先算清楚實拿多少：單筆勞務報酬的 10% 所得稅代扣與二代健保補充保費
          2.11%，加上整年的所得稅估算。免註冊，直接算。
        </p>
        <p className="text-xs text-foreground-muted mb-10">
          本頁採用目前現行規定（所得稅為 115 年度、2026 年所得適用的數字）。稅率、費率與各項門檻每年都可能調整，正式申報請以財政部與衛福部健保署當年度公告為準。
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-medium mb-3">單筆勞務報酬實拿試算</h2>
          <p className="text-sm text-foreground-muted mb-4">
            客戶或平台給付勞務報酬（執行業務所得）時，單筆達 2 萬元會代扣二代健保補充保費、超過
            2 萬元再代扣 10% 所得稅。輸入金額看實拿多少。
          </p>
          <LaborIncomeCalculator />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-medium mb-3">年度所得稅估算</h2>
          <p className="text-sm text-foreground-muted mb-4">
            用 {TAX_YEAR_LABEL} 的免稅額、標準扣除額與課稅級距，估算整年接案收入大約要繳多少所得稅。
          </p>
          <TaxEstimator defaultGross={0} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">常見疑問</h2>
          <div className="flex flex-col gap-5">
            {faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-base font-medium mb-1.5">{f.question}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border rounded-lg p-5 bg-surface">
          <h2 className="text-base font-medium mb-1.5">每張報價單都自動算好，不用再回來按計算機</h2>
          <p className="text-sm text-foreground-muted leading-relaxed mb-4">
            {siteName}開報價單時會自動試算含稅、勞務報酬代扣與實拿金額給你和客戶看，接受後自動變成待收款、逾期自動提醒。給自由接案者與一人公司的免費工具。
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-block bg-accent text-accent-foreground rounded-md px-5 py-2 text-sm font-medium"
          >
            免費註冊
          </Link>
        </section>
      </main>

      <footer className="px-4 sm:px-6 py-8 border-t border-border flex justify-between items-center text-sm text-foreground-muted mt-auto">
        <Link href="/" className="hover:text-foreground">
          {siteName}
        </Link>
        <Link href="/privacy?from=home" className="hover:text-foreground">
          隱私權政策
        </Link>
      </footer>
    </div>
  );
}
