import { GitHubRelease } from "@/types/github";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatRelativeDate } from "@/lib/utils";

interface ReleasesCardProps {
  releases: GitHubRelease[] | null;
  error?: string;
}

export function ReleasesCard({ releases, error }: ReleasesCardProps) {
  return (
    <Card
      title="GitHub Releases"
      icon={
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      }
      headerRight={
        <ExternalLink
          href="https://github.com/anthropics/claude-code/releases"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          全て見る →
        </ExternalLink>
      }
    >
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : !releases || releases.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">リリース情報がありません</p>
      ) : (
        <ul className="space-y-3">
          {releases.map((release) => (
            <li key={release.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <ExternalLink href={release.html_url} className="font-medium text-sm">
                  {release.tag_name}
                </ExternalLink>
                {release.prerelease && <Badge label="pre-release" color="orange" />}
              </div>
              {release.name && release.name !== release.tag_name && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{release.name}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeDate(release.published_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
