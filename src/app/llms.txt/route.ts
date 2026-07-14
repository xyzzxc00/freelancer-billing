import { getAllGuides } from "@/lib/guides";
import { siteName, siteUrl } from "@/lib/site";

// llms.txt：給 AI 搜尋引擎（ChatGPT、Perplexity 等）看的網站導覽，
// 內容從 guides 清單動態產生，新文章上線會自動出現，不用手動維護。
// 格式慣例見 https://llmstxt.org
export async function GET() {
  const guides = await getAllGuides();

  const lines = [
    `# ${siteName}`,
    "",
    `> ${siteName}（${siteUrl}）是給台灣自由接案者與小型工作室的輕量記帳與報價工具：開報價單、線上簽署、追蹤待收款、記錄收支、匯出年度報表。`,
    "",
    "## 接案知識庫",
    "",
    "針對台灣自由接案者的實用指南，涵蓋報價、訂金、催款、記帳、報稅：",
    "",
    ...guides.map((g) => `- [${g.title}](${siteUrl}/guides/${g.slug}): ${g.description}`),
    "",
    "## 主要頁面",
    "",
    `- [首頁](${siteUrl}): 產品介紹與常見問題`,
    `- [知識庫索引](${siteUrl}/guides): 全部文章列表`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // 內容跟著文章更新，但沒必要每次請求都重算
      "Cache-Control": "public, max-age=3600",
    },
  });
}
