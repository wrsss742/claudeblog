# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド（TypeScript 型チェック含む）
npm run start    # 本番サーバー起動
npm run lint     # ESLint 実行
```

開発サーバーを再起動する際は、既存プロセスとロックファイルを先に削除する：
```bash
pkill -f "next dev"
rm -f .next/dev/lock
```

## 環境変数

`.env.local` に設定する（`.env.example` 参照）：
- `GITHUB_TOKEN`: GitHub PAT（`read:public_repo` スコープ）。未設定でも動作するが 60 req/h 制限になる。

## アーキテクチャ

### データフロー

`src/app/page.tsx`（Server Component）が全フェッチャーを `Promise.allSettled` で並列実行し、結果（fulfilled/rejected）をそのままカードコンポーネントに props として渡す。いずれかのソースが失敗しても他のカードは表示される。

```
page.tsx
  └─ Promise.allSettled([
       fetchGitHubReleases, fetchNpmInfo, fetchGitHubIssues,  ← lib/fetchers/github.ts, npm.ts
       fetchAnthropicBlog,                                     ← lib/fetchers/rss.ts
       fetchTwitterAlt,                                        ← lib/fetchers/twitter-alt.ts
       fetchJapaneseTech                                       ← lib/fetchers/japanese-tech.ts
     ])
  └─ 各 *Card コンポーネントへ props を渡す
```

### キャッシュ

各 `fetch()` 呼び出しに `next: { revalidate, tags }` を付与することで Next.js の Data Cache を使用。設定値は `src/lib/cache.ts` の `REVALIDATE` / `CACHE_TAGS` に一元管理されている。手動更新は `POST /api/revalidate` が `revalidatePath('/', 'layout')` を呼ぶことで実現。

| ソース | revalidate |
|--------|-----------|
| GitHub Releases / npm | 3600 秒 |
| Anthropic Blog / 日本語記事 | 1800 秒 |
| X / HN（話題） | 600 秒 |
| GitHub Issues/PR | 300 秒 |

### 翻訳

`src/lib/translate.ts` が Google Translate 非公式エンドポイント（`translate.googleapis.com`）を使用。ひらがな・カタカナ・漢字を含むテキストは翻訳をスキップ。失敗時は原文を返す。ブログ記事（`rss.ts`）とツイート（`twitter-alt.ts`）のフェッチ時に適用される。

### X（Twitter）カードのフォールバック

`twitter-alt.ts` は以下の順序で試みる：
1. Nitter RSS インスタンスを順番に試す（5 秒タイムアウト）
2. 全インスタンス失敗時 → Hacker News Algolia API（直近 2 週間の Anthropic/Claude 関連記事）

カードの表示は `source` フィールド（`"x"` or `"hackernews"`）で切り替わる。

### 日本語記事ランキング（`japanese-tech.ts`）

Qiita・Zenn・note.com を並列取得し、ストック数（Qiita）/ いいね数（note）降順でソートした上位 10 件を返す。

- **Qiita**: `tag:claudecode OR tag:claude-code`、`sort=stock`、直近 3 ヶ月
- **Zenn**: `https://zenn.dev/topics/claude/feed`（RSS/Atom）、直近 2 週間
- **note.com**: `/api/v2/searches?context=note&q=claude`（非公式 API）、直近 2 週間

いいねが 1 件以上の記事のみ表示。該当なしの場合は全件にフォールバック。

### Next.js バージョン固有の注意点

- **Next.js 16**（本リポジトリ使用）では `revalidateTag()` の型シグネチャが変更されたため、手動リフレッシュには `revalidatePath('/', 'layout')` を使用している。
- `tsconfig.json` のパスエイリアス `@/*` は `./src/*` を指す（デフォルトの `./` ではない）。
