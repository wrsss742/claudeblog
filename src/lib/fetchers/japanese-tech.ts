import { XMLParser } from "fast-xml-parser";
import { JapaneseArticle } from "@/types/dashboard";
import { CACHE_TAGS, REVALIDATE } from "@/lib/cache";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

function isWithin(dateStr: string, windowMs: number): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && Date.now() - date.getTime() <= windowMs;
}

function isWithin_TWO_WEEKS(dateStr: string): boolean {
  return isWithin(dateStr, TWO_WEEKS_MS);
}

// ── Qiita ────────────────────────────────────────────────────────────────────
// tag:claudecode をストック数順で取得（タグトレンドに最も近い指標）
// 直近3ヶ月以内に絞り、古すぎる記事を除外する

interface QiitaItem {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user: { id: string; name: string };
  likes_count: number;
  stocks_count: number;
}

async function fetchQiita(): Promise<JapaneseArticle[]> {
  const params = new URLSearchParams({
    query: "tag:claudecode OR tag:claude-code",
    per_page: "20",
    sort: "stock", // ストック数順 ＝ Qiita トレンドの主要指標
  });

  const res = await fetch(`https://qiita.com/api/v2/items?${params}`, {
    next: { revalidate: REVALIDATE.japaneseTech, tags: [CACHE_TAGS.japaneseTech] },
  });
  if (!res.ok) throw new Error(`Qiita: ${res.status}`);

  const items: QiitaItem[] = await res.json();
  return items
    .filter((item) => isWithin(item.created_at, THREE_MONTHS_MS))
    .map((item) => ({
      title: item.title,
      link: item.url,
      pubDate: item.created_at,
      source: "qiita" as const,
      author: item.user.name || item.user.id,
      likes: item.stocks_count ?? item.likes_count, // ストック数を優先
    }));
}

// ── Zenn ─────────────────────────────────────────────────────────────────────

async function fetchZenn(): Promise<JapaneseArticle[]> {
  const res = await fetch("https://zenn.dev/topics/claude/feed", {
    next: { revalidate: REVALIDATE.japaneseTech, tags: [CACHE_TAGS.japaneseTech] },
  });
  if (!res.ok) throw new Error(`Zenn: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const result = parser.parse(xml);

  const entries = result?.feed?.entry ?? [];
  const arr = Array.isArray(entries) ? entries : [entries];

  return arr
    .filter((e: Record<string, unknown>) =>
      isWithin_TWO_WEEKS(String(e.updated ?? e.published ?? ""))
    )
    .map((e: Record<string, unknown>) => {
      const linkVal = e.link;
      const href =
        typeof linkVal === "object" && linkVal !== null
          ? String((linkVal as Record<string, unknown>)["@_href"] ?? "")
          : String(linkVal ?? "");
      const author =
        typeof e.author === "object" && e.author !== null
          ? String((e.author as Record<string, unknown>).name ?? "")
          : "";
      return {
        title: String(e.title ?? ""),
        link: href,
        pubDate: String(e.updated ?? e.published ?? ""),
        source: "zenn" as const,
        author,
      };
    });
}

// ── note.com ─────────────────────────────────────────────────────────────────

interface NoteContent {
  id: string;
  name: string;
  noteUrl: string;
  publishAt: string;
  user: { urlname: string; nickname: string };
  likeCount: number;
}

interface NoteSearchResponse {
  data?: { notes?: { contents?: NoteContent[] } };
}

async function fetchNote(): Promise<JapaneseArticle[]> {
  const params = new URLSearchParams({ context: "note", q: "claude", size: "20" });
  const res = await fetch(`https://note.com/api/v2/searches?${params}`, {
    next: { revalidate: REVALIDATE.japaneseTech, tags: [CACHE_TAGS.japaneseTech] },
  });
  if (!res.ok) throw new Error(`note: ${res.status}`);

  const data: NoteSearchResponse = await res.json();
  const contents = data?.data?.notes?.contents ?? [];

  return contents
    .filter((item) => isWithin_TWO_WEEKS(item.publishAt))
    .map((item) => ({
      title: item.name,
      link: item.noteUrl,
      pubDate: item.publishAt,
      source: "note" as const,
      author: item.user.nickname || item.user.urlname,
      likes: item.likeCount,
    }));
}

// ── 統合：いいね数でランキングしてTOP10 ─────────────────────────────────────

export async function fetchJapaneseTech(): Promise<JapaneseArticle[]> {
  const [qiita, zenn, note] = await Promise.allSettled([
    fetchQiita(),
    fetchZenn(),
    fetchNote(),
  ]);

  const articles: JapaneseArticle[] = [
    ...(qiita.status === "fulfilled" ? qiita.value : []),
    ...(zenn.status === "fulfilled" ? zenn.value : []),
    ...(note.status === "fulfilled" ? note.value : []),
  ];

  if (articles.length === 0) {
    throw new Error("直近2週間の日本語記事が見つかりませんでした");
  }

  // いいね数（降順）→ 投稿日時（降順）の優先順位でソート
  articles.sort((a, b) => {
    const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  // いいねが1件以上の記事に絞る。該当がなければ全件にフォールバック
  const withLikes = articles.filter((a) => (a.likes ?? 0) > 0);
  return (withLikes.length > 0 ? withLikes : articles).slice(0, 10);
}
