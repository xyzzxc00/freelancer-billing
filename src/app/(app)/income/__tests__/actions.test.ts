import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockReceivableUpdate = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mockTransaction },
}));
vi.mock("@/lib/auth", () => ({ requireUserId: vi.fn().mockResolvedValue("user_1") }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/toast", () => ({
  redirectWithToast: (path: string, message: string) => mockRedirect(path, message),
}));

describe("deleteIncomeAction", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindFirst.mockReset();
    mockDelete.mockReset();
    mockReceivableUpdate.mockReset();
    mockTransaction.mockReset();
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        transaction: { findFirst: mockFindFirst, delete: mockDelete },
        receivable: { update: mockReceivableUpdate },
      })
    );
  });

  it("刪除由標記已收款自動建立的收入時，對應的應收款要改回待收款", async () => {
    mockFindFirst.mockResolvedValue({ receivableId: "recv_1" });

    const { deleteIncomeAction } = await import("../actions");
    await deleteIncomeAction("txn_1");

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "txn_1" } });
    expect(mockReceivableUpdate).toHaveBeenCalledWith({
      where: { id: "recv_1" },
      data: { status: "PENDING", paidAt: null },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/income", "已刪除收入，對應的應收款已改回待收款");
  });

  it("刪除一般手動輸入的收入（沒有 receivableId）不會動到應收款", async () => {
    mockFindFirst.mockResolvedValue({ receivableId: null });

    const { deleteIncomeAction } = await import("../actions");
    await deleteIncomeAction("txn_2");

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "txn_2" } });
    expect(mockReceivableUpdate).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/income", "已刪除收入");
  });

  it("找不到這筆交易（不屬於自己或已被刪除）時不做任何變更", async () => {
    mockFindFirst.mockResolvedValue(null);

    const { deleteIncomeAction } = await import("../actions");
    await deleteIncomeAction("txn_missing");

    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockReceivableUpdate).not.toHaveBeenCalled();
  });
});
