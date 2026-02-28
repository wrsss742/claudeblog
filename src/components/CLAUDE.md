# CLAUDE.md — src/components/

## ディレクトリ構成の役割

| ディレクトリ | 役割 |
|-------------|------|
| `cards/` | データソース 1 つに対応するカード（Server Component） |
| `dashboard/` | ページ全体のレイアウト・操作コンポーネント |
| `ui/` | 汎用プリミティブ（`Card` / `Badge` / `ExternalLink`） |

## カードコンポーネントの規約

### <required> props インターフェース

すべてのカードは以下のパターンで props を受け取ること：

```typescript
interface XxxCardProps {
  data: DataType[] | null;   // null = ローディング失敗
  error?: string;             // エラーメッセージ（あれば表示）
}
```

`error` と `data` の両方を処理する三分岐を必ず実装する：

```tsx
{error ? (
  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
) : !data || data.length === 0 ? (
  <p className="text-sm text-gray-500 dark:text-gray-400">データがありません</p>
) : (
  <ul>...</ul>
)}
```

### <required> ベース Card コンポーネントの使用

すべてのカードは `src/components/ui/Card.tsx` をラップすること。
独自の `div` でカード外枠を作らない。

```tsx
import { Card } from "@/components/ui/Card";

export function XxxCard({ data, error }: XxxCardProps) {
  return (
    <Card title="カード名" icon={<.../>} headerRight={<ExternalLink .../>}>
      {/* 中身 */}
    </Card>
  );
}
```

### <optional> headerRight

外部リンク（「全て見る →」など）を右上に置く場合は `Card` の `headerRight` props を使う。

## Server / Client Component の使い分け

### <required>

- `cards/` と `dashboard/DashboardGrid.tsx`・`LastUpdated.tsx` は **Server Component**（`"use client"` なし）
- ブラウザ API・React hooks（`useState`, `useRouter` 等）を使うものだけ `"use client"` を付ける

### <forbidden>

カードコンポーネントに `"use client"` を付けないこと。
データ取得はすべてサーバーサイド（`page.tsx` のフェッチャー）で行い、
結果を props として受け取る設計を維持すること。

現在 `"use client"` が付いているのは `dashboard/RefreshButton.tsx` のみ（`useRouter`, `useTransition` 使用）。

## UI プリミティブの使い方

| コンポーネント | 使用場面 |
|----------------|---------|
| `<Badge label="..." color="green|blue|purple|orange|red|gray" />` | ソース名・ラベル・ステータス表示 |
| `<ExternalLink href="...">` | 外部サイトへのリンク（`target="_blank" rel="noopener noreferrer"` 自動付与） |

### <forbidden>

外部リンクを `<a href="..." target="_blank">` で直接書かないこと。
`ExternalLink` を使うことで `rel="noopener noreferrer"` が自動付与される。

## ダークモード

<required>
すべての色指定に `dark:` バリアントを付けること。
`globals.css` の CSS 変数（`--background`, `--foreground`）と Tailwind の `dark:` クラスが OS のカラースキームに追従する。
</required>

例：
```tsx
// ✅ 正しい
<p className="text-gray-700 dark:text-gray-300">...</p>

// ❌ ダークモード未対応
<p className="text-gray-700">...</p>
```
