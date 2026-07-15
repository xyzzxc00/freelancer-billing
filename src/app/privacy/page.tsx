import Link from "next/link";

export const metadata = {
  title: "隱私權政策",
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const back =
    from === "login"
      ? { href: "/login", label: "← 返回登入" }
      : { href: "/", label: "← 返回首頁" };

  return (
    <div className="flex flex-1 justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href={back.href} className="text-sm text-foreground-muted hover:text-foreground">
          {back.label}
        </Link>
        <h1 className="text-xl font-medium mt-4 mb-1">隱私權政策</h1>
        <p className="text-sm text-foreground-muted mb-8">最後更新：2026 年 7 月</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-medium mb-2">我們蒐集哪些資料</h2>
            <p className="text-foreground-muted">
              註冊時的 email（使用 Google 登入時，會從你的 Google
              帳號取得 email、名稱與頭像）；你在使用過程中自己輸入或上傳的資料，包括客戶聯絡資訊、報價單內容、收支記錄、分類設定、支出收據照片等；以及你透過意見回饋表單提供的內容。除上述
              Google 登入外，我們不會主動向第三方蒐集你的個人資料。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">這些資料用來做什麼</h2>
            <p className="text-foreground-muted">
              這些資料只用來提供記帳、報價單管理等本服務的核心功能，例如顯示你的客戶清單、計算稅務試算、寄送報價單回應通知。我們不會將你的資料用於與服務無關的目的，也不會出售、出租或交換給第三方做行銷使用。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">資料存放在哪裡</h2>
            <p className="text-foreground-muted">
              你的資料儲存在 Supabase 提供的資料庫服務上，並透過 Row-Level Security
              機制確保每個帳號只能存取自己的資料，包含我們（服務提供者）在內，都不會透過一般操作介面瀏覽到其他使用者的資料內容。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">會用到的第三方服務</h2>
            <ul className="text-foreground-muted list-disc pl-5 flex flex-col gap-1">
              <li>
                <span className="font-medium text-foreground">Supabase</span> — 資料庫、帳號驗證與檔案儲存（收據照片存放在僅你本人能存取的私有空間）
              </li>
              <li>
                <span className="font-medium text-foreground">Google</span> — 若你選擇使用 Google 帳號登入，由 Google 提供身分驗證
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span> — 網站託管與執行，並提供匿名的流量統計與網頁效能量測（不使用 cookie，也不會識別個別訪客）
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span> — 寄送系統通知信（例如報價單回應、逾期提醒、重設密碼信）
              </li>
            </ul>
            <p className="text-foreground-muted mt-2">
              這些服務商僅基於提供技術服務的必要範圍接觸到你的資料，不會將資料用於各自的其他商業目的。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">報價單分享連結（給收到連結的客戶）</h2>
            <p className="text-foreground-muted">
              你產生的報價單分享連結，任何取得連結的人都能查看該份報價單內容（不需登入），方便客戶查看與回應。請只將連結提供給你信任的客戶，不要公開分享。
            </p>
            <p className="text-foreground-muted mt-2">
              若你是收到連結的客戶：當你首次開啟連結時，系統會記錄開啟時間並通知報價單提供者；當你接受報價時，你填寫的姓名與回應時間會一併保存，作為雙方合作的確認依據。這些資料同樣僅用於本服務功能，不會另作他用。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">Cookie 的使用</h2>
            <p className="text-foreground-muted">
              本服務只使用維持登入狀態所必要的 cookie，沒有廣告或跨站追蹤用途的
              cookie。登出後即失效。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">資料保留、刪除與聯絡方式</h2>
            <p className="text-foreground-muted">
              你可以隨時在「設定」頁面修改個人資料，或自行刪除客戶、報價單、收支記錄等內容。若你想完整刪除帳號與所有相關資料，或對資料使用方式有任何疑問，請寄信到{" "}
              <a href="mailto:xyzzxc00@gmail.com" className="text-accent hover:underline">
                xyzzxc00@gmail.com
              </a>
              ，我們會在合理時間內處理。
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">政策更新</h2>
            <p className="text-foreground-muted">
              若本政策內容有重大變更，我們會在這個頁面更新內容與日期。建議偶爾回來查看。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
