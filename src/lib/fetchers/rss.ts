import { XMLParser } from "fast-xml-parser";
import { BlogPost } from "@/types/dashboard";
import { CACHE_TAGS, REVALIDATE } from "@/lib/cache";
import { stripHtml } from "@/lib/utils";
import { translateAll } from "@/lib/translate";

const RSS_URLS = [
  "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml",
  "https://raw.githubusercontent.com/conoro/anthropic-engineering-rss-feed/main/anthropic_engineering_rss.xml",
];

async function fetchRss(url: string): Promise<BlogPost[]> {
  const res = await fetch(url, {
    next: {
      revalidate: REVALIDATE.blog,
      tags: [CACHE_TAGS.blog],
    },
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(xml);

  const items = result?.rss?.channel?.item ?? result?.feed?.entry ?? [];
  const itemArray = Array.isArray(items) ? items : [items];

  const raw = itemArray.slice(0, 5).map((item: Record<string, unknown>) => ({
    title: String(item.title ?? ""),
    link: String(item.link ?? item.url ?? ""),
    pubDate: String(item.pubDate ?? item.published ?? item.updated ?? ""),
    description: stripHtml(String(item.description ?? item.summary ?? item.content ?? "")),
    author: String(item.author ?? item["dc:creator"] ?? ""),
  }));

  // タイトルと説明を並列で日本語翻訳
  const titles = await translateAll(raw.map((p) => p.title));
  const descs = await translateAll(raw.map((p) => p.description));

  return raw.map((p, i) => ({
    ...p,
    title: titles[i],
    description: descs[i],
  }));
}

export async function fetchAnthropicBlog(): Promise<BlogPost[]> {
  for (const url of RSS_URLS) {
    try {
      const posts = await fetchRss(url);
      if (posts.length > 0) return posts;
    } catch {
      // フォールバック
    }
  }
  throw new Error("全てのAnthropicブログRSSフィードの取得に失敗しました");
}
