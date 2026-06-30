import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useBlurErrors } from "../use-blur-errors";

function TestForm() {
  const { fieldErrors, onBlur } = useBlurErrors({
    amount: (v) => (!v || Number(v) <= 0 ? "請填寫大於 0 的金額" : ""),
  });

  return (
    <div>
      <input aria-label="amount" name="amount" onBlur={onBlur} />
      {fieldErrors.amount && <p>{fieldErrors.amount}</p>}
    </div>
  );
}

describe("useBlurErrors", () => {
  it("欄位失焦且值無效時顯示錯誤訊息", () => {
    render(<TestForm />);
    const input = screen.getByLabelText("amount");

    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);

    expect(screen.getByText("請填寫大於 0 的金額")).toBeInTheDocument();
  });

  it("欄位失焦且值有效時不顯示錯誤", () => {
    render(<TestForm />);
    const input = screen.getByLabelText("amount");

    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.blur(input);

    expect(screen.queryByText("請填寫大於 0 的金額")).not.toBeInTheDocument();
  });
});
