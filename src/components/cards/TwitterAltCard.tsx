import { Tweet } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatRelativeDate } from "@/lib/utils";

interface TwitterAltCardProps {
  tweets: Tweet[] | null;
  error?: string;
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function HNIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896H6.95z" />
    </svg>
  );
}

export function TwitterAltCard({ tweets, error }: TwitterAltCardProps) {
  const isHN = tweets?.[0]?.source === "hackernews";
  const title = isHN ? "Anthropic 話題 (HN)" : "@AnthropicAI (X)";
  const icon = isHN ? <HNIcon /> : <XIcon />;
  const headerLink = isHN
    ? { href: "https://news.ycombinator.com/", label: "HNで見る →" }
    : { href: "https://x.com/AnthropicAI", label: "Xで見る →" };

  return (
    <Card
      title={title}
      icon={icon}
      headerRight={
        <ExternalLink href={headerLink.href} className="text-xs text-gray-500 dark:text-gray-400">
          {headerLink.label}
        </ExternalLink>
      }
    >
      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            データ取得に失敗しました
          </p>
          <ExternalLink href="https://x.com/AnthropicAI" className="text-sm">
            @AnthropicAI をXで確認する →
          </ExternalLink>
        </div>
      ) : !tweets || tweets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">データがありません</p>
      ) : (
        <>
          {isHN && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              ※ X/Nitter が利用不可のため Hacker News の直近2週間の関連記事を表示中
            </p>
          )}
          <ul className="space-y-3">
            {tweets.map((item, i) => (
              <li key={i} className="flex flex-col gap-1">
                <ExternalLink href={item.link} className="text-sm font-medium leading-snug">
                  {item.title}
                </ExternalLink>
                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  {item.pubDate && <span>{formatRelativeDate(item.pubDate)}</span>}
                  {item.points != null && <span>▲ {item.points}</span>}
                  {item.comments != null && <span>💬 {item.comments}</span>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
