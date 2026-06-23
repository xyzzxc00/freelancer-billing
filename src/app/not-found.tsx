import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
      <p className="text-5xl font-medium text-accent mb-3">404</p>
      <h1 className="text-xl font-medium mb-2">找不到這個頁面</h1>
      <p className="text-sm text-foreground-muted max-w-sm leading-relaxed mb-8">
        這個連結可能已經失效、被刪除，或網址輸入錯誤。如果你是透過報價單分享連結進來的，請向對方確認連結是否仍然有效。
      </p>
      <Link
        href="/"
        className="bg-accent text-accent-foreground rounded-md px-6 py-2.5 text-sm font-medium"
      >
        回到首頁
      </Link>
    </div>
  );
}
