import type { NextRequest } from "next/server";

// 集中管理 cron 路由的驗證：CRON_SECRET 沒設定時直接拒絕，
// 避免 `Bearer ${undefined}` 這種字面字串意外變成「有效」的驗證值。
export function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
