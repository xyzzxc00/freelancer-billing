"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

type Action = (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;

export function PublicPageForm({
  action,
  defaultSlug,
  defaultBio,
  defaultServices,
}: {
  action: Action;
  defaultSlug: string;
  defaultBio: string;
  defaultServices: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-foreground-muted block mb-1">網址代稱</label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground-muted whitespace-nowrap">/p/</span>
          <input
            name="slug"
            defaultValue={defaultSlug}
            placeholder="例如：wang-design"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full font-mono"
          />
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          只能用小寫英文字母、數字與連字號（-），3-30 個字。
        </p>
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">自我介紹</label>
        <textarea
          name="bio"
          defaultValue={defaultBio}
          placeholder="簡單介紹你自己與擅長的領域"
          rows={3}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
        />
      </div>
      <div>
        <label className="text-sm text-foreground-muted block mb-1">服務項目</label>
        <textarea
          name="services"
          defaultValue={defaultServices}
          placeholder="例如：品牌識別設計、網站前端開發、Logo 設計…"
          rows={3}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
        />
      </div>
      <FormError message={state?.error} />
      <div className="flex items-center gap-3">
        <SubmitButton
          pendingLabel="儲存中…"
          className="bg-accent text-accent-foreground rounded-md py-2 text-sm font-medium self-start px-4 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
        >
          儲存
        </SubmitButton>
        <Link href="/inquiries" className="text-sm text-foreground-muted hover:text-foreground">
          查看收到的詢價 →
        </Link>
      </div>
    </form>
  );
}
