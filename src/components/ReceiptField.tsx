"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB，跟 bucket 的 file_size_limit 一致
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

export function ReceiptField({
  defaultReceiptUrl,
  defaultPreviewUrl,
}: {
  defaultReceiptUrl?: string | null;
  defaultPreviewUrl?: string | null;
}) {
  const [path, setPath] = useState<string | null>(defaultReceiptUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultPreviewUrl ?? null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast.error("檔案太大，請上傳 5MB 以下的圖片或 PDF");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("請重新登入後再試");
        return;
      }

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const newPath = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("receipts").upload(newPath, file);
      if (error) {
        console.error("上傳憑證失敗:", error);
        toast.error("上傳失敗，請稍後再試");
        return;
      }

      setPath(newPath);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPath(null);
    setPreviewUrl(null);
  }

  return (
    <div>
      <input type="hidden" name="receiptUrl" value={path ?? ""} />
      <label className="text-sm text-foreground-muted block mb-1">憑證照片（選填）</label>

      {previewUrl ? (
        <div className="flex items-center gap-3">
          {previewUrl.endsWith(".pdf") || path?.endsWith(".pdf") ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              查看 PDF 憑證
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="憑證預覽" className="w-16 h-16 object-cover rounded-md border border-border" />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-[color:var(--danger-fg)] hover:underline"
          >
            移除
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept={ACCEPT}
          disabled={uploading}
          onChange={handleFileChange}
          className="text-sm w-full text-foreground-muted disabled:opacity-50 cursor-pointer file:cursor-pointer file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-accent-foreground hover:file:opacity-80"
        />
      )}
      {uploading && <p className="text-xs text-foreground-muted mt-1">上傳中…</p>}
    </div>
  );
}
