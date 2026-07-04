import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyCronAuth } from "../cron-auth";

describe("verifyCronAuth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  function request(authorization?: string) {
    return new NextRequest("http://localhost/api/cron/x", {
      headers: authorization ? { authorization } : undefined,
    });
  }

  it("正確的 bearer token 通過驗證", () => {
    expect(verifyCronAuth(request("Bearer test-secret"))).toBe(true);
  });

  it("缺少 authorization header 時拒絕", () => {
    expect(verifyCronAuth(request())).toBe(false);
  });

  it("錯誤的 token 時拒絕", () => {
    expect(verifyCronAuth(request("Bearer wrong-secret"))).toBe(false);
  });

  it("CRON_SECRET 未設定時一律拒絕，避免 'Bearer undefined' 被誤判為有效", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronAuth(request("Bearer undefined"))).toBe(false);
  });
});
