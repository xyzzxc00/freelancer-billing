import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { LogoutButton } from "@/components/LogoutButton";
import { TipPanel } from "@/components/TipPanel";
import { updateProfileAction } from "./actions";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // identities 裡只有 google（沒有 email）代表純 OAuth 用戶，沒有密碼
  const isOAuthOnly =
    data.user?.identities?.length === 1 &&
    data.user.identities[0].provider !== "email";

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div>
      <h1 className="text-lg font-medium mb-6">帳戶設定</h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium mb-3">個人資料</h2>
        <form action={updateProfileAction} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-foreground-muted block mb-1">顯示名稱</label>
            <input
              name="name"
              defaultValue={profile?.name ?? ""}
              placeholder="例如：王小明"
              className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
            />
            <p className="text-xs text-foreground-muted mt-1">
              會顯示在右上角的帳戶圖示，留空則用 email 開頭字母代替。
            </p>
          </div>
          <div>
            <label className="text-sm text-foreground-muted block mb-1">Email</label>
            <input
              disabled
              value={profile?.email ?? ""}
              className="border border-border rounded-md px-3 py-2 text-sm bg-surface w-full text-foreground-muted"
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium self-start px-4"
          >
            儲存
          </button>
        </form>
      </section>

      {isOAuthOnly ? (
        <section className="mb-8">
          <h2 className="text-sm font-medium mb-3">變更密碼</h2>
          <p className="text-sm text-foreground-muted">
            你是透過 Google 登入，不需要設定密碼。
          </p>
        </section>
      ) : (
        <section className="mb-8">
          <h2 className="text-sm font-medium mb-3">變更密碼</h2>
          <PasswordChangeForm />
        </section>
      )}

      <section className="mb-8">
        <Link href="/privacy" className="text-sm text-foreground-muted hover:text-foreground">
          隱私權政策
        </Link>
      </section>

      <section>
        <LogoutButton className="text-sm text-[color:var(--danger-fg)] hover:underline" />
      </section>
      </div>

      <TipPanel
        title="接案帳本能幫你做什麼"
        description="幾個常用功能的入口，剛開始用可以從這裡探索。"
        steps={[
          "報價單 — 開報價單給客戶，客戶可線上接受或拒絕",
          "待收款 — 追蹤哪些案子還沒收到款，設定到期提醒",
          "收入／支出 — 記帳並分類，年底報表自動統計",
          "報表 — 查看每月收支走勢與各分類佔比",
        ]}
      />
      </div>
    </div>
  );
}
