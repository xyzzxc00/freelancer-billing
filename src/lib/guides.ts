import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  related: string[]; // 手動指定的相關文章 slug，用於文章頁「延伸閱讀」區塊
}

export interface Guide extends GuideMeta {
  content: string; // markdown body
}

const GUIDES_DIR = join(process.cwd(), "content", "guides");

// 極簡 frontmatter parser：開頭以 --- 包住的 key: value 區塊
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) data[key] = value;
  }
  return { data, body: match[2] };
}

async function readGuide(fileName: string): Promise<Guide> {
  const raw = await readFile(join(GUIDES_DIR, fileName), "utf8");
  const { data, body } = parseFrontmatter(raw);
  return {
    slug: fileName.replace(/\.md$/, ""),
    title: data.title ?? fileName,
    description: data.description ?? "",
    date: data.date ?? "",
    related: data.related ? data.related.split(",").map((s) => s.trim()).filter(Boolean) : [],
    content: body.trim(),
  };
}

export async function getAllGuides(): Promise<GuideMeta[]> {
  let files: string[];
  try {
    files = (await readdir(GUIDES_DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const guides = await Promise.all(files.map(readGuide));
  // 日期新到舊
  return guides
    .map(({ slug, title, description, date, related }) => ({ slug, title, description, date, related }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getGuide(slug: string): Promise<Guide | null> {
  try {
    return await readGuide(`${slug}.md`);
  } catch {
    return null;
  }
}
