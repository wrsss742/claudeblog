# CLAUDE.md — src/lib/fetchers/

このディレクトリの各ファイルは単一のデータソースに対応する。

## ファイル一覧

| ファイル | データソース | 主要 API |
|----------|-------------|----------|
| `github.ts` | GitHub Releases / Issues | `api.github.com/repos/anthropics/claude-code` |
| `npm.ts` | npm パッケージ情報 | `registry.npmjs.org/@anthropic-ai/claude-code` |
| `rss.ts` | Anthropic Blog | GitHub 上のサードパーティ RSS XML |
| `twitter-alt.ts` | X(@AnthropicAI) / HN フォールバック | Nitter RSS → HN Algolia API |
| `japanese-tech.ts` | 日本語技術記事 | Qiita API / Zenn RSS / note.com 非公式 API |

## 新規フェッチャーの実装規約

### <required> 必須パターン

すべての `fetch()` 呼び出しに `next` オプションを付与すること：

```typescript
const res = await fetch(url, {
  next: {
    revalidate: REVALIDATE.yourSource,   // src/lib/cache.ts から参照
    tags: [CACHE_TAGS.yourSource],       // src/lib/cache.ts から参照
  },
});
```

新しいソースを追加する場合は `src/lib/cache.ts` に `REVALIDATE` と `CACHE_TAGS` のエントリを追加してから使う。

### <required> エラーハンドリング

フェッチャーはエラーを **throw** する。握りつぶさない。
`page.tsx` の `Promise.allSettled` がエラーをキャッチして `error` props に変換する。

```typescript
if (!res.ok) throw new Error(`SourceName: ${res.status} ${res.statusText}`);
```

### <required> 翻訳の適用タイミング

英語テキストの翻訳はフェッチャー内（`fetch` 直後）で実行し、翻訳済みデータをキャッシュに乗せること。

```typescript
import { translateAll } from "@/lib/translate";

const titles = await translateAll(items.map((i) => i.title));
return items.map((item, idx) => ({ ...item, title: titles[idx] }));
```

### <optional> フォールバック構造

複数インスタンスや複数ソースを試す場合のパターン：

```typescript
for (const endpoint of ENDPOINTS) {
  try {
    const result = await fetchFrom(endpoint);
    if (result.length > 0) return result;
  } catch { /* 次へ */ }
}
// 最終フォールバック
return fetchAlternative();
```

### <forbidden> 禁止事項

- `fetch()` に `next` オプションなしで呼ぶこと（キャッシュが効かない）
- REVALIDATE 秒数をフェッチャーファイル内にハードコードすること
- キャッチしたエラーを無視して空配列を返すだけにすること（デバッグ困難になる）
- ブラウザに露出してはならない値（`GITHUB_TOKEN` 等）を `NEXT_PUBLIC_` プレフィックス付きで定義すること

## 時間フィルタのユーティリティ

`japanese-tech.ts` の `isWithin(dateStr, windowMs)` が汎用的に使えるパターン。
新しいフェッチャーで日時フィルタが必要な場合は同様の関数をローカルで定義する（`utils.ts` には含めない——外部 API 固有のロジックのため）。
