import { NpmPackageInfo } from "@/types/npm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatRelativeDate } from "@/lib/utils";

interface NpmCardProps {
  info: NpmPackageInfo | null;
  error?: string;
}

export function NpmCard({ info, error }: NpmCardProps) {
  return (
    <Card
      title="npm Package"
      icon={
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z" />
        </svg>
      }
      headerRight={
        info ? (
          <ExternalLink href={info.npmUrl} className="text-xs text-gray-500 dark:text-gray-400">
            npmで見る →
          </ExternalLink>
        ) : undefined
      }
    >
      {error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : !info ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">データがありません</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {info.name}
            </span>
            <Badge label={`v${info.latestVersion}`} color="green" />
          </div>
          {info.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{info.description}</p>
          )}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              直近のバージョン
            </p>
            <ul className="space-y-1">
              {info.recentVersions.map((v) => (
                <li key={v.version} className="flex items-center justify-between text-xs">
                  <ExternalLink
                    href={`https://www.npmjs.com/package/${encodeURIComponent(info.name)}/v/${v.version}`}
                  >
                    v{v.version}
                  </ExternalLink>
                  <span className="text-gray-400 dark:text-gray-500">
                    {v.date ? formatRelativeDate(v.date) : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
