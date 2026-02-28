import { JapaneseArticle } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatRelativeDate } from "@/lib/utils";

interface JapaneseTechCardProps {
  articles: JapaneseArticle[] | null;
  error?: string;
}

const SOURCE_META: Record<
  JapaneseArticle["source"],
  { label: string; color: "green" | "blue" | "purple" }
> = {
  qiita: { label: "Qiita", color: "green"  },
  zenn:  { label: "Zenn",  color: "blue"   },
  note:  { label: "note",  color: "purple" },
};

const RANK_COLORS = [
  "text-yellow-500",  // 1位
  "text-gray-400",    // 2位
  "text-orange-400",  // 3位
];

export function JapaneseTechCard({ articles, error }: JapaneseTechCardProps) {
  return (
    <Card
      title="日本語記事 TOP10 (直近2週間)"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
    >
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : !articles || articles.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          直近2週間の記事が見つかりませんでした
        </p>
      ) : (
        <ol className="space-y-2.5">
          {articles.map((article, i) => {
            const meta = SOURCE_META[article.source];
            const rankColor = RANK_COLORS[i] ?? "text-gray-300 dark:text-gray-600";
            return (
              <li key={i} className="flex items-start gap-2.5">
                {/* 順位 */}
                <span className={`text-sm font-bold w-5 shrink-0 text-right ${rankColor}`}>
                  {i + 1}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge label={meta.label} color={meta.color} />
                    <ExternalLink
                      href={article.link}
                      className="text-sm font-medium leading-snug"
                    >
                      {article.title}
                    </ExternalLink>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    {article.pubDate && <span>{formatRelativeDate(article.pubDate)}</span>}
                    {article.author && <span>{article.author}</span>}
                    {article.likes != null && article.likes > 0 && (
                      <span className="text-pink-400 dark:text-pink-500">♥ {article.likes}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
