export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * 從文章 markdown 抽出「常見疑問」段落的問答，供 FAQPage 結構化資料使用。
 * 只認 `## 常見疑問` 標題底下、`- **問題** 答案` 格式的清單項目，
 * 到下一個 `##` 標題（或文末）為止；其他段落的粗體清單不會被誤抓。
 */
export function extractFaq(content: string): FaqItem[] {
  const sectionMatch = content.match(/^##\s*常見疑問\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!sectionMatch) return [];

  const items: FaqItem[] = [];
  for (const line of sectionMatch[1].split("\n")) {
    const itemMatch = line.match(/^-\s+\*\*(.+?)\*\*\s*(.+)$/);
    if (!itemMatch) continue;
    const question = itemMatch[1].trim();
    const answer = itemMatch[2].trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}
