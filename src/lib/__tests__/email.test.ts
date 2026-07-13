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

  it("寄信成功時回傳 true 並記錄收件人、主旨與 sent 狀態", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ id: "msg_123" });

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: { to: "test@example.com", subject: "測試", status: "sent" },
    });
  });

  it("寄信失敗時重試、回傳 false 並記錄 failed 狀態與錯誤訊息", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockRejectedValue(new Error("Network error"));

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(2); // 原本 + 1 次重試
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: { to: "test@example.com", subject: "測試", status: "failed", error: "Network error" },
    });
  });

  it("resend.emails.send() 回傳 { error } 而非拋例外時（例如 429），仍要判定失敗並重試", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    // 真實的 Resend SDK 對 API 錯誤（含 429）不會 reject，而是 resolve 成 { data: null, error }
    mockSend.mockResolvedValue({
      data: null,
      error: { name: "rate_limit_exceeded", message: "Too many requests" },
    });

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(2); // 有被判定失敗才會重試
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        to: "test@example.com",
        subject: "測試",
        status: "failed",
        error: expect.stringContaining("rate_limit_exceeded"),
      },
    });
  });

  it("emailLog 寫入失敗時不影響寄信結果，也不會重寄", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ id: "msg_123" });
    mockCreate.mockRejectedValue(new Error("DB down"));

    const { sendEmail } = await import("../email");
    const result = await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce(); // log 失敗不觸發重寄
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

  it("每日額度只計算 sent 狀態的紀錄", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ id: "msg_123" });

    const { sendEmail } = await import("../email");
    await sendEmail({ to: "test@example.com", subject: "測試", html: "<p>內容</p>" });

    expect(mockCount).toHaveBeenCalledWith({
      where: { sentAt: { gte: expect.any(Date) }, status: "sent" },
    });
  });
});
