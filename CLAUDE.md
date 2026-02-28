# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| `README.md` | プロジェクト概要・起動手順（create-next-app デフォルト） |
| `.env.example` | 環境変数のサンプルと説明 |
| `src/lib/fetchers/CLAUDE.md` | フェッチャー実装規約 |
| `src/components/CLAUDE.md` | コンポーネント実装規約 |

---

## コマンド

### 開発

```bash
npm run dev      # 開発サーバー起動（デフォルト http://localhost:3000）
npm run build    # 本番ビルド（TypeScript 型チェック含む）
npm run lint     # ESLint 実行
```

### 開発サーバーの再起動

<required>
既存プロセスとロックファイルを削除してから起動すること。これを省略すると
`.next/dev/lock` によって起動に失敗する。
</required>

```bash
pkill -f "next dev"
rm -f .next/dev/lock
npm run dev
```

---

## 環境変数

設定ファイル: `.env.local`（`.env.example` を参照）

| 変数 | 重要度 | 説明 |
|------|--------|------|
| `GITHUB_TOKEN` | <optional>省略可</optional> | GitHub PAT（`read:public_repo`）。未設定時は 60 req/h 制限 |

<forbidden>
`.env.local` をコミットしないこと。`.gitignore` 対象。
</forbidden>

---

## アーキテクチャ

### 全体構成

```
src/
├── app/
│   ├── page.tsx              # ダッシュボード本体（Server Component）
│   ├── layout.tsx            # ルートレイアウト・メタデータ
│   ├── globals.css           # Tailwind v4 + ダークモード CSS 変数
│   └── api/revalidate/       # 手動リフレッシュ API
├── components/
│   ├── cards/                # データソースごとのカード（6種）
│   ├── dashboard/            # グリッド・リフレッシュボタン・更新日時
│   └── ui/                   # 汎用 UI（Card / Badge / ExternalLink）
├── lib/
│   ├── fetchers/             # データ取得ロジック（ソースごとに1ファイル）
│   ├── cache.ts              # REVALIDATE / CACHE_TAGS の一元管理
│   ├── translate.ts          # Google Translate 非公式エンドポイント
│   └── utils.ts              # 日時フォーマット・HTML除去
└── types/                    # 型定義（github / npm / dashboard）
```

### データフロー

<required>
`src/app/page.tsx` が `Promise.allSettled` で全フェッチャーを並列実行すること。
`Promise.all` に変更すると1件の失敗で全カードが表示されなくなる。
</required>

```
page.tsx (Server Component)
  └─ Promise.allSettled([
       fetchGitHubReleases()   → src/lib/fetchers/github.ts
       fetchNpmInfo()          → src/lib/fetchers/npm.ts
       fetchGitHubIssues()     → src/lib/fetchers/github.ts
       fetchAnthropicBlog()    → src/lib/fetchers/rss.ts
       fetchTwitterAlt()       → src/lib/fetchers/twitter-alt.ts
       fetchJapaneseTech()     → src/lib/fetchers/japanese-tech.ts
     ])
  └─ 各 *Card に { data | null, error? } を props として渡す
```

### キャッシュ戦略

<required>
キャッシュ設定値は `src/lib/cache.ts` の `REVALIDATE` / `CACHE_TAGS` のみで管理すること。
フェッチャー内にハードコードしない。
</required>

<forbidden>
`revalidateTag(tag)` を単独で呼ばないこと。Next.js 16 では第2引数が必須になり型エラーになる。
手動リフレッシュには `revalidatePath('/', 'layout')` を使用する（`src/app/api/revalidate/route.ts`）。
</forbidden>

| ソース | revalidate |
|--------|-----------|
| GitHub Releases / npm | 3600 秒（1時間） |
| Anthropic Blog / 日本語記事 | 1800 秒（30分） |
| X / HN 話題 | 600 秒（10分） |
| GitHub Issues/PR | 300 秒（5分） |

### 翻訳

`src/lib/translate.ts` が Google Translate 非公式エンドポイント（`translate.googleapis.com/translate_a/single`）を使用。

<required>
翻訳はフェッチャー内で実行し、キャッシュに乗せること。
コンポーネント側で翻訳を呼ぶとキャッシュが効かずページ表示のたびに API を叩く。
</required>

- ひらがな・カタカナ・漢字（`/[\u3040-\u9FFF]/`）を含む場合は翻訳をスキップ
- タイムアウト 8 秒・失敗時は原文にフォールバック
- 現在の適用対象: Anthropic Blog のタイトル・説明文、X/HN のタイトル・本文

### X カードのフォールバック構造

```
fetchTwitterAlt()
  1. Nitter RSS インスタンスを順番に試す（タイムアウト 5 秒/件）
  2. 全インスタンス失敗 → HN Algolia API（直近 2 週間・Anthropic/Claude）
```

<optional>
Nitter インスタンスを追加する場合は `src/lib/fetchers/twitter-alt.ts` の
`NITTER_INSTANCES` 配列に追加する。
</optional>

カードの表示内容は `Tweet.source`（`"x"` | `"hackernews"`）で分岐している。

### 日本語記事ランキング（TOP10）

`src/lib/fetchers/japanese-tech.ts` が Qiita・Zenn・note.com を並列取得。

| ソース | クエリ | ソート | 期間 |
|--------|--------|--------|------|
| Qiita | `tag:claudecode OR tag:claude-code` | `sort=stock`（ストック数） | 3ヶ月 |
| Zenn | `/topics/claude/feed`（RSS） | 日時順 | 2週間 |
| note.com | `/api/v2/searches?q=claude`（非公式） | いいね数 | 2週間 |

合算後、ストック/いいね数降順 → 日時降順でソートして上位 10 件。いいね 0 件は除外（該当なし時は全件表示）。

---

## Next.js 16 固有の注意点

<required>
`tsconfig.json` のパスエイリアス `@/*` は `./src/*` を指す（create-next-app デフォルトの `./` とは異なる）。
インポートは常に `@/lib/...`、`@/components/...` 形式を使うこと。
</required>

- `revalidateTag` の代替: 上記「キャッシュ戦略」の forbidden 参照
- Turbopack がデフォルト有効（`next dev` で自動使用）
