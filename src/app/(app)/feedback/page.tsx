"use client";

import { useActionState } from "react";
import { sendFeedbackAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";

const faqs = [
  {
    q: "資料安全嗎？會不會遺失？",
    a: "所有資料存在 Supabase 雲端資料庫，每天自動備份，不會因為換裝置或清快取而遺失。",
  },
  {
    q: "有手機版嗎？",
    a: "有，接案帳本支援手機瀏覽器，也可以安裝到主畫面當 App 使用（PWA）。",
  },
  {
    q: "客戶看到的報價單長什麼樣子？",
    a: "送出後客戶會收到連結，可以線上查看報價內容並選擇接受或拒絕，不需要下載任何東西。",
  },
  {
    q: "報表功能怎麼用？",
    a: "記帳時選好分類，到「報表」頁面就能看每月收支走勢和各分類佔比，年底統計特別方便。",
  },
];

export default function FeedbackPage() {
  const [state, action] = useActionState(sendFeedbackAction, undefined);

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="max-w-sm">
      <h1 className="text-lg font-medium mb-1">意見回饋</h1>
      <p className="text-sm text-foreground-muted mb-6">
        有任何建議、問題或想法都歡迎告訴我。
      </p>

      {state?.success ? (
        <div className="rounded-md bg-surface border border-border px-4 py-6 text-sm text-center">
          <p className="text-base mb-1">✓</p>
          <p>{state.success}</p>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-foreground-muted block mb-1">名稱</label>
            <input
              name="name"
              placeholder="你的名字"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
          </div>

          <div>
            <label className="text-sm text-foreground-muted block mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="your@email.com"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
            <p className="text-xs text-foreground-muted mt-1">若你希望我回覆請填寫，可留空。</p>
          </div>

          <div>
            <label className="text-sm text-foreground-muted block mb-1">內容</label>
            <textarea
              name="message"
              rows={5}
              placeholder="想說什麼都可以，例如功能建議、遇到的問題…"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
            />
          </div>

          <FormError message={state?.error} />

          <SubmitButton pendingLabel="送出中…">送出回饋</SubmitButton>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-foreground-muted mb-3">也可以在 Threads 上找到我：</p>
        <a
          href="https://www.threads.net/@corey.0_"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm hover:text-foreground-muted transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 192 192" fill="currentColor" aria-hidden="true">
            <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 6.982 4.678 15.975 6.963 25.345 6.432 12.34-.701 22.023-5.39 28.776-13.934 5.196-6.589 8.487-15.113 9.94-25.788 5.953 3.594 10.36 8.329 12.8 13.966 4.203 9.8 4.453 25.905-8.606 38.952-11.526 11.518-25.378 16.484-46.286 16.632-23.169-.164-40.687-7.589-52.062-22.075C28.848 125.442 23.24 107.3 23.024 84.491c.216-22.809 5.824-40.951 16.657-53.88C50.854 17.16 68.372 9.736 91.54 9.572c23.344.164 41.44 7.638 53.786 22.212 6.076 7.21 10.637 16.25 13.57 26.821l16.205-4.971c-3.593-13.25-9.464-24.688-17.556-34.078C142.474 2.79 120.679 -6.925e-4 91.69 0h-.247C62.594.003 41.18 9.82 26.188 29.198 12.723 46.687 5.753 71.27 5.51 84.456v.137c.243 13.186 7.213 37.769 20.678 55.258C41.163 159.18 62.577 169 91.443 169h.247c25.928-.183 44.016-6.977 58.96-21.906 19.5-19.482 18.95-43.74 12.503-58.651-4.558-10.622-13.222-19.283-21.616-23.455Z" />
            <path d="M102.074 87.814c-7.01-.424-14.781.596-21.15 5.036-6.19 4.318-9.463 10.774-9.116 17.957.346 7.17 4.496 13.066 11.25 16.496 5.846 2.986 13.18 3.962 20.75 2.806 9.468-1.454 16.578-6.097 20.432-13.046 1.974-3.572 3.008-7.754 3.074-12.437.044-3.15-.154-6.232-.593-9.205-4.547-2.222-10.022-4.105-13.96-4.893-.001.001-.452-.581-10.687-.714Z" />
          </svg>
          @corey.0_
        </a>
      </div>
      </div>

      <div className="bg-surface rounded-lg p-6 hidden lg:block">
        <p className="text-base font-medium mb-4">常見問題</p>
        <div className="flex flex-col gap-5">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <p className="text-sm font-medium mb-1">{faq.q}</p>
              <p className="text-sm text-foreground-muted leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
