import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("只有一頁時不渲染任何內容", () => {
    const { container } = render(
      <Pagination currentPage={1} totalCount={10} pageSize={50} buildHref={(p) => `/x?page=${p}`} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("第一頁時「上一頁」不可點擊", () => {
    render(<Pagination currentPage={1} totalCount={120} pageSize={50} buildHref={(p) => `/x?page=${p}`} />);
    const prev = screen.getByText("上一頁");
    expect(prev.tagName).not.toBe("A");
  });

  it("最後一頁時「下一頁」不可點擊", () => {
    render(<Pagination currentPage={3} totalCount={120} pageSize={50} buildHref={(p) => `/x?page=${p}`} />);
    const next = screen.getByText("下一頁");
    expect(next.tagName).not.toBe("A");
  });

  it("中間頁時上一頁與下一頁都可點擊並連到正確網址", () => {
    render(<Pagination currentPage={2} totalCount={120} pageSize={50} buildHref={(p) => `/x?page=${p}`} />);
    expect(screen.getByText("上一頁")).toHaveAttribute("href", "/x?page=1");
    expect(screen.getByText("下一頁")).toHaveAttribute("href", "/x?page=3");
  });

  it("顯示正確的總筆數與頁碼", () => {
    render(<Pagination currentPage={2} totalCount={120} pageSize={50} buildHref={(p) => `/x?page=${p}`} />);
    expect(screen.getByText("共 120 筆，第 2 / 3 頁")).toBeInTheDocument();
  });
});
