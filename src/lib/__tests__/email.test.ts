import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: { count: mockCount, create: mockCreate },
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset();
    mockCount.mockReset().mockResolvedValue(0);
    mockCreate.mockReset().mockResolvedValue({ id: "log_1", sentAt: new Date() });
  });

  it("RESEND_API_KEY 未設定時回傳 false", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "test", html: "<p>test</p>" });

    expect(result).toBe(false);
    process.env.RESEND_API_KEY = originalKey;
  });

  it("寄信成功時回傳 true 並記錄一筆 log", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ id: "msg_123" });

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("寄信失敗時重試並最終回傳 false", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockRejectedValue(new Error("Network error"));

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(2); // 原本 + 1 次重試
  });

  it("今日寄信量已達上限時跳過寄送", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_DAILY_LIMIT = "90";
    mockCount.mockResolvedValue(90);

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
    delete process.env.RESEND_DAILY_LIMIT;
  });
});
