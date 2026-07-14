import { describe, it, expect } from "vitest";
import { extractFaq } from "../guide-faq";

describe("extractFaq", () => {
  it("從常見疑問段落抽出問答", () => {
    const md = [
      "## 訂金比例怎麼抓",
      "- **30%**：最常見的比例",
      "",
      "## 常見疑問",
      "",
      "- **客戶不願意付訂金怎麼辦？** 可以解釋這是接案的標準流程",
      "- **訂金退還嗎？** 建議報價或合約裡先講清楚",
      "",
      "收訂金不是不信任客戶。",
    ].join("\n");

    expect(extractFaq(md)).toEqual([
      { question: "客戶不願意付訂金怎麼辦？", answer: "可以解釋這是接案的標準流程" },
      { question: "訂金退還嗎？", answer: "建議報價或合約裡先講清楚" },
    ]);
  });

  it("常見疑問之外段落的粗體清單不會被誤抓", () => {
    const md = [
      "## 為什麼要收訂金",
      "- **鎖定客戶的承諾**：客戶付了訂金代表認真要做",
      "",
      "## 常見疑問",
      "- **只有這題？** 對",
      "",
      "## 下一段",
      "- **這也不該被抓** 因為已經離開常見疑問段落",
    ].join("\n");

    expect(extractFaq(md)).toEqual([{ question: "只有這題？", answer: "對" }]);
  });

  it("常見疑問是最後一段（到文末）也能抽出", () => {
    const md = "## 常見疑問\n- **問？** 答";
    expect(extractFaq(md)).toEqual([{ question: "問？", answer: "答" }]);
  });

  it("沒有常見疑問段落時回傳空陣列", () => {
    expect(extractFaq("## 其他段落\n- **粗體** 內容")).toEqual([]);
  });
});
