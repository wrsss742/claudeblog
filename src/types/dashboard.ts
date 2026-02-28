export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  author?: string;
}

export interface Tweet {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: "x" | "hackernews";
  points?: number;
  comments?: number;
}

export interface JapaneseArticle {
  title: string;
  link: string;
  pubDate: string;
  source: "qiita" | "zenn" | "note";
  author?: string;
  likes?: number;
}

export type FetchResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };
