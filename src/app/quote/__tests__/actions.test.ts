import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdateMany = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() => vi.fn());
const mockTxQuoteUpdateMany = vi.hoisted(() => vi.fn());
const mockTxReceivableCreate = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quote: { findUnique: mockFindUnique, updateMany: mockUpdateMany },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const baseQuote = {
  id: "quote_1",
  userId: "user_1",
  status: "SENT",
  depositPercent: null,
  title: "網站設計案",
  client: { name: "王小明" },
  profile: { email: "owner@example.com" },
  items: [{ unitPrice: 1000, quantity: 2 }],
};

describe("respondToQuoteAction", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindUnique.mockReset();
    mockUpdateMany.mockReset();
    mockTransaction.mockReset();
    mockTxQuoteUpdateMany.mockReset();
    mockTxReceivableCreate.mockReset();
    mockSendEmail.mockReset().mockResolvedValue(true);
    mockRevalidatePath.mockReset();

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        quote: { updateMany: mockTxQuoteUpdateMany },
        receivable: { create: mockTxReceivableCreate },
      })
    );
  });

  function formData(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  }

  it("已被其他併發請求接受過時（updateMany count=0）回傳錯誤，不建立收款紀錄", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuote });
    mockTxQuoteUpdateMany.mockResolvedValue({ count: 0 });

    const { respondToQuoteAction } = await import("../actions");
    const result = await respondToQuoteAction(
      "tok_1",
      "ACCEPTED",
      undefined,
      formData({ signerName: "王小明" })
    );

    expect(result?.error).toBe("這份報價單已經回覆過了，請重新整理頁面查看最新狀態");
    expect(mockTxReceivableCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("成功接受、無訂金時建立單筆 FULL 收款紀錄", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuote });
    mockTxQuoteUpdateMany.mockResolvedValue({ count: 1 });
    mockTxReceivableCreate.mockResolvedValue({});

    const { respondToQuoteAction } = await import("../actions");
    const result = await respondToQuoteAction(
      "tok_1",
      "ACCEPTED",
      undefined,
      formData({ signerName: "王小明" })
    );

    expect(result).toBeUndefined();
    expect(mockTxReceivableCreate).toHaveBeenCalledOnce();
    expect(mockTxReceivableCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: "FULL", amount: 2000 }),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/quote/tok_1");
  });

  it("有訂金比例時建立 DEPOSIT + FINAL 兩筆收款紀錄，加總等於總額", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuote, depositPercent: 30 });
    mockTxQuoteUpdateMany.mockResolvedValue({ count: 1 });
    mockTxReceivableCreate.mockResolvedValue({});

    const { respondToQuoteAction } = await import("../actions");
    await respondToQuoteAction("tok_1", "ACCEPTED", undefined, formData({ signerName: "王小明" }));

    expect(mockTxReceivableCreate).toHaveBeenCalledTimes(2);
    const amounts = mockTxReceivableCreate.mock.calls.map((c) => c[0].data.amount);
    expect(amounts.reduce((a: number, b: number) => a + b, 0)).toBe(2000);
  });

  it("已被其他併發請求拒絕過時（updateMany count=0）回傳錯誤", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuote });
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const { respondToQuoteAction } = await import("../actions");
    const result = await respondToQuoteAction("tok_1", "REJECTED", undefined, formData({}));

    expect(result?.error).toBe("這份報價單已經回覆過了，請重新整理頁面查看最新狀態");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
