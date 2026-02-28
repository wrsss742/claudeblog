import { BlogPost } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatRelativeDate } from "@/lib/utils";

interface BlogCardProps {
  posts: BlogPost[] | null;
  error?: string;
}

export function BlogCard({ posts, error }: BlogCardProps) {
  return (
    <Card
      title="Anthropic Blog"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      }
      headerRight={
        <ExternalLink
          href="https://www.anthropic.com/news"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          全て見る →
        </ExternalLink>
      }
    >
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : !posts || posts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">記事がありません</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post, i) => (
            <li key={i} className="flex flex-col gap-1">
              <ExternalLink href={post.link} className="text-sm font-medium leading-snug">
                {post.title}
              </ExternalLink>
              {post.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {post.description}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {post.pubDate ? formatRelativeDate(post.pubDate) : ""}
                {post.author ? ` · ${post.author}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
