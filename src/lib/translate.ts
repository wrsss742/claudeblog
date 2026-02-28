const GOOGLE_TRANSLATE_URL =
  "https://translate.googleapis.com/translate_a/single";

/**
 * Google Translate 非公式エンドポイントで英語→日本語に翻訳する。
 * すでに日本語を含む場合・空文字・エラー時はそのまま返す。
 */
export async function translateToJapanese(text: string): Promise<string> {
  if (!text.trim()) return text;
  // ひらがな・カタカナ・漢字を含む場合は翻訳不要
  if (/[\u3040-\u9FFF]/.test(text)) return text;

  const url = new URL(GOOGLE_TRANSLATE_URL);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "ja");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return text;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return text;

    const translated = (data[0] as unknown[])
      .map((chunk) => (Array.isArray(chunk) ? String(chunk[0] ?? "") : ""))
      .join("");

    return translated || text;
  } catch {
    return text;
  }
}

/**
 * 複数テキストを並列翻訳する。個々のエラーは元テキストにフォールバック。
 */
export async function translateAll(texts: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    texts.map((t) => translateToJapanese(t))
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : texts[i]
  );
}
