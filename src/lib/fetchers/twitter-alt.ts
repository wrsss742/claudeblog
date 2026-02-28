import { XMLParser } from "fast-xml-parser";
import { Tweet } from "@/types/dashboard";
import { CACHE_TAGS, REVALIDATE } from "@/lib/cache";
import { stripHtml } from "@/lib/utils";
import { translateAll } from "@/lib/translate";

const NITTER_INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.1d4.us",
  "https://nitter.cz",
  "https://nitter.net",
];

const TWITTER_HANDLE = "AnthropicAI";

interface HNHit {
  objectID: string;
  title?: string;
  url?: string;
  created_at?: string;
  points?: number;
  num_comments?: number;
  story_text?: string;
}

async function fetchNitterRss(baseUrl: string): Promise<Tweet[]> {
  const url = `${baseUrl}/${TWITTER_HANDLE}/rss`;
  const res = await fetch(url, {
    next: {
      revalidate: REVALIDATE.twitterAlt,
      tags: [CACHE_TAGS.twitterAlt],
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`Nitter ${baseUrl}: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(xml);

  const items = result?.rss?.channel?.item ?? [];
  const itemArray = Array.isArray(items) ? items : [items];
  if (itemArray.length === 0) throw new Error(`Nitter ${baseUrl}: empty feed`);

  const raw = itemArray.slice(0, 5).map((item: Record<string, unknown>) => ({
    title: String(item.title ?? ""),
    link: String(item.link ?? ""),
    pubDate: String(item.pubDate ?? ""),
    description: stripHtml(String(item.description ?? "")),
    source: "x" as const,
  }));

  const descs = await translateAll(raw.map((t) => t.description || t.title));
  return raw.map((t, i) => ({ ...t, description: descs[i] }));
}

async function fetchHackerNews(): Promise<Tweet[]> {
  const twoWeeksAgo = Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60;
  const params = new URLSearchParams({
    query: "anthropic claude",
    tags: "story",
    hitsPerPage: "8",
    numericFilters: `created_at_i>${twoWeeksAgo}`,
  });
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?${params}`,
    {
      next: {
        revalidate: REVALIDATE.twitterAlt,
        tags: [CACHE_TAGS.twitterAlt],
      },
    }
  );

  if (!res.ok) throw new Error(`HN fetch failed: ${res.status}`);

  const data: { hits: HNHit[] } = await res.json();
  const hits = data.hits.filter((h) => h.title);
  if (hits.length === 0) throw new Error("直近2週間のHN記事が見つかりません");

  const titles = await translateAll(hits.map((h) => h.title ?? ""));

  return hits.slice(0, 5).map((h, i) => ({
    title: titles[i],
    link: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
    pubDate: h.created_at ?? "",
    description: "",
    source: "hackernews" as const,
    points: h.points,
    comments: h.num_comments,
  }));
}

export async function fetchTwitterAlt(): Promise<Tweet[]> {
  // Nitter インスタンスを順番に試す
  for (const instance of NITTER_INSTANCES) {
    try {
      return await fetchNitterRss(instance);
    } catch {
      // 次のインスタンスへ
    }
  }

  // 全 Nitter が失敗したら Hacker News にフォールバック
  return fetchHackerNews();
}
